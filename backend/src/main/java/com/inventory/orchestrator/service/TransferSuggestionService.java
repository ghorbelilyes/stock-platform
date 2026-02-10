package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.dto.TransferSuggestionDTO;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.repository.StockRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes transfer suggestions by comparing stock levels across stores:
 * suggests moving stock from stores with excess to stores with low or zero stock.
 */
@Service
public class TransferSuggestionService {

    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int MIN_EXCESS_QUANTITY = 10;
    private static final int MAX_SUGGESTIONS = 50;

    private final StockRepository stockRepository;
    private final TransferRepository transferRepository;
    private final AuditService auditService;

    public TransferSuggestionService(StockRepository stockRepository, 
                                   TransferRepository transferRepository,
                                   AuditService auditService) {
        this.stockRepository = stockRepository;
        this.transferRepository = transferRepository;
        this.auditService = auditService;
    }

    /**
     * Build suggestion id used by front and for approve: "fromStoreId-toStoreId-productId"
     */
    public static String suggestionId(Long fromStoreId, Long toStoreId, Long productId) {
        return fromStoreId + "-" + toStoreId + "-" + productId;
    }

    /**
     * Parse suggestion id back to fromStoreId, toStoreId, productId. Returns null if invalid.
     */
    public static long[] parseSuggestionId(String suggestionId) {
        if (suggestionId == null) return null;
        String[] parts = suggestionId.split("-");
        if (parts.length != 3) return null;
        try {
            return new long[] {
                Long.parseLong(parts[0]),
                Long.parseLong(parts[1]),
                Long.parseLong(parts[2])
            };
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public List<TransferSuggestionDTO> getSuggestions() {
        List<StockView> allStock = stockRepository.findViewsWithFilters(
            null, null, null, null, null, null, null,
            Pageable.unpaged()
        ).getContent();

        // Group by product: productId -> list of (storeId, storeName, productName, sku, quantity)
        Map<Long, List<StockEntry>> byProduct = new HashMap<>();
        for (StockView v : allStock) {
            StockEntry e = new StockEntry(
                v.getIdStore(),
                v.getStore().getName(),
                v.getIdProduct(),
                v.getProduct().getName(),
                v.getProduct().getCodeBarre(),
                v.getQuantity()
            );
            byProduct.computeIfAbsent(v.getIdProduct(), k -> new ArrayList<>()).add(e);
        }

        List<TransferSuggestionDTO> suggestions = new ArrayList<>();
        String now = Instant.now().toString();

        for (Map.Entry<Long, List<StockEntry>> e : byProduct.entrySet()) {
            Long productId = e.getKey();
            List<StockEntry> entries = e.getValue();
            if (entries.size() < 2) continue;

            int totalQty = entries.stream().mapToInt(StockEntry::getQuantity).sum();
            double avg = (double) totalQty / entries.size();

            // Donors: quantity >= MIN_EXCESS_QUANTITY and above average (can give some away)
            List<StockEntry> donors = entries.stream()
                .filter(s -> s.getQuantity() >= MIN_EXCESS_QUANTITY && s.getQuantity() > avg)
                .sorted(Comparator.comparingInt(StockEntry::getQuantity).reversed())
                .collect(Collectors.toList());

            // Receivers: quantity < LOW_STOCK_THRESHOLD (need stock)
            List<StockEntry> receivers = entries.stream()
                .filter(s -> s.getQuantity() < LOW_STOCK_THRESHOLD)
                .sorted(Comparator.comparingInt(StockEntry::getQuantity))
                .collect(Collectors.toList());

            String productName = entries.get(0).getProductName();
            String sku = entries.get(0).getSku();

            for (StockEntry donor : donors) {
                if (suggestions.size() >= MAX_SUGGESTIONS) break;
                int donorExcess = Math.max(0, donor.getQuantity() - (int) Math.ceil(avg));

                for (StockEntry receiver : receivers) {
                    if (donor.getStoreId().equals(receiver.getStoreId())) continue;
                    if (suggestions.size() >= MAX_SUGGESTIONS) break;

                    int need = LOW_STOCK_THRESHOLD - receiver.getQuantity();
                    if (need <= 0) continue;

                    int transferQty = Math.min(donorExcess, need);
                    if (transferQty <= 0) continue;

                    String priority = receiver.getQuantity() == 0 ? "high" : (receiver.getQuantity() < 3 ? "medium" : "low");
                    int confidence = receiver.getQuantity() == 0 ? 95 : (receiver.getQuantity() < 3 ? 80 : 65);
                    String reason = receiver.getQuantity() == 0
                        ? "Stock out at destination"
                        : "Low stock at destination (" + receiver.getQuantity() + " on hand)";

                    TransferSuggestionDTO dto = new TransferSuggestionDTO();
                    dto.setId(suggestionId(donor.getStoreId(), receiver.getStoreId(), productId));
                    dto.setFromStoreId(donor.getStoreId());
                    dto.setFromStoreName(donor.getStoreName());
                    dto.setToStoreId(receiver.getStoreId());
                    dto.setToStoreName(receiver.getStoreName());
                    dto.setSku(sku);
                    dto.setProductId(productId);
                    dto.setProductName(productName);
                    dto.setQuantity(transferQty);
                    dto.setPriority(priority);
                    dto.setReason(reason);
                    dto.setConfidence(confidence);
                    dto.setCreatedAt(now);
                    suggestions.add(dto);
                }
            }
        }

        // Sort by priority (high first) then confidence
        suggestions.sort(Comparator
            .comparing(TransferSuggestionDTO::getPriority, (a, b) -> priorityOrder(b) - priorityOrder(a))
            .thenComparing(TransferSuggestionDTO::getConfidence, Comparator.reverseOrder()));

        return suggestions;
    }

    private static int priorityOrder(String p) {
        if ("high".equals(p)) return 3;
        if ("medium".equals(p)) return 2;
        return 1;
    }

    /**
     * Approve a suggestion: create the actual transfer. Quantity is optional (uses suggestion quantity if not provided).
     */
    public Transfer approveSuggestion(String suggestionId, Integer quantityOverride) {
        long[] ids = parseSuggestionId(suggestionId);
        if (ids == null) {
            throw new IllegalArgumentException("Invalid suggestion id: " + suggestionId);
        }
        long fromStoreId = ids[0];
        long toStoreId = ids[1];
        long productId = ids[2];

        List<TransferSuggestionDTO> list = getSuggestions();
        TransferSuggestionDTO suggestion = list.stream()
            .filter(s -> suggestionId.equals(s.getId()))
            .findFirst()
            .orElse(null);

        int quantity = quantityOverride != null && quantityOverride > 0
            ? quantityOverride
            : (suggestion != null ? suggestion.getQuantity() : 1);

        if (quantity <= 0) quantity = 1;

        Transfer t = new Transfer(
            LocalDateTime.now(),
            fromStoreId,
            toStoreId,
            productId,
            "Approved transfer suggestion",
            quantity,
            "approved"  // Status: approved (will move to in_transit later)
        );
        Transfer saved = transferRepository.save(t);
        
        // Audit log the transfer approval
        auditService.logAudit(
            "TRANSFER_APPROVE",
            "Transfer",
            saved.getId(),
            null, // No old value for new transfer
            saved // New value
        );
        
        return saved;
    }

    private static class StockEntry {
        private final Long storeId;
        private final String storeName;
        private final Long productId;
        private final String productName;
        private final String sku;
        private final int quantity;

        StockEntry(Long storeId, String storeName, Long productId, String productName, String sku, int quantity) {
            this.storeId = storeId;
            this.storeName = storeName;
            this.productId = productId;
            this.productName = productName;
            this.sku = sku;
            this.quantity = quantity;
        }

        Long getStoreId() { return storeId; }
        String getStoreName() { return storeName; }
        Long getProductId() { return productId; }
        String getProductName() { return productName; }
        String getSku() { return sku; }
        int getQuantity() { return quantity; }
    }
}
