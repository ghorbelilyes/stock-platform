package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.CreateTransferSuggestionRequest;
import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.dto.TransferSuggestionDTO;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.entity.TransferSuggestion;
import com.inventory.orchestrator.repository.ProductRepository;
import com.inventory.orchestrator.repository.StockRepository;
import com.inventory.orchestrator.repository.StoreRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import com.inventory.orchestrator.repository.TransferSuggestionRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages transfer suggestions stored in the database.
 * Can also compute suggestions dynamically from stock levels.
 */
@Service
public class TransferSuggestionService {

    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int MIN_EXCESS_QUANTITY = 10;
    private static final int MAX_SUGGESTIONS = 50;

    private final StockRepository stockRepository;
    private final TransferRepository transferRepository;
    private final TransferSuggestionRepository suggestionRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final SettingsService settingsService;

    public TransferSuggestionService(
            StockRepository stockRepository,
            TransferRepository transferRepository,
            TransferSuggestionRepository suggestionRepository,
            StoreRepository storeRepository,
            ProductRepository productRepository,
            SettingsService settingsService) {
        this.stockRepository = stockRepository;
        this.transferRepository = transferRepository;
        this.suggestionRepository = suggestionRepository;
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
        this.settingsService = settingsService;
    }

    /**
     * Build suggestion id used by front and for approve:
     * "fromStoreId-toStoreId-productId"
     */
    public static String suggestionId(Long fromStoreId, Long toStoreId, Long productId) {
        return fromStoreId + "-" + toStoreId + "-" + productId;
    }

    /**
     * Parse suggestion id back to fromStoreId, toStoreId, productId. Returns null
     * if invalid.
     */
    public static long[] parseSuggestionId(String suggestionId) {
        if (suggestionId == null)
            return null;
        String[] parts = suggestionId.split("-");
        if (parts.length != 3)
            return null;
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

    /**
     * Get all transfer suggestions from the database.
     */
    public List<TransferSuggestionDTO> getSuggestions() {
        List<TransferSuggestion> entities = suggestionRepository.findAll();

        // Fetch store and product names for all suggestions
        Map<Long, String> storeNames = new HashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        Map<Long, String> productSkus = new HashMap<>();

        for (TransferSuggestion ts : entities) {
            if (!storeNames.containsKey(ts.getFromStoreId())) {
                storeRepository.findById(ts.getFromStoreId())
                        .ifPresent(store -> storeNames.put(store.getId(), store.getName()));
            }
            if (!storeNames.containsKey(ts.getToStoreId())) {
                storeRepository.findById(ts.getToStoreId())
                        .ifPresent(store -> storeNames.put(store.getId(), store.getName()));
            }
            if (!productNames.containsKey(ts.getProductId())) {
                productRepository.findById(ts.getProductId())
                        .ifPresent(product -> {
                            productNames.put(product.getId(), product.getName());
                            productSkus.put(product.getId(), product.getCodeBarre());
                        });
            }
        }

        // Convert entities to DTOs
        List<TransferSuggestionDTO> suggestions = new ArrayList<>();
        for (TransferSuggestion ts : entities) {
            TransferSuggestionDTO dto = new TransferSuggestionDTO();
            dto.setId(suggestionId(ts.getFromStoreId(), ts.getToStoreId(), ts.getProductId()));
            dto.setFromStoreId(ts.getFromStoreId());
            dto.setFromStoreName(storeNames.getOrDefault(ts.getFromStoreId(), "Unknown Store"));
            dto.setToStoreId(ts.getToStoreId());
            dto.setToStoreName(storeNames.getOrDefault(ts.getToStoreId(), "Unknown Store"));
            dto.setSku(productSkus.getOrDefault(ts.getProductId(), ""));
            dto.setProductId(ts.getProductId());
            dto.setProductName(productNames.getOrDefault(ts.getProductId(), "Unknown Product"));
            dto.setQuantity(ts.getQuantity());
            dto.setPriority(ts.getPriority());
            dto.setReason(ts.getReason());
            dto.setConfidence(ts.getConfidence());
            dto.setCreatedAt(ts.getCreatedAt() != null ? ts.getCreatedAt().toString() : Instant.now().toString());
            suggestions.add(dto);
        }

        // Sort by priority (high first) then confidence
        suggestions.sort(Comparator
                .comparing(TransferSuggestionDTO::getPriority, (a, b) -> priorityOrder(b) - priorityOrder(a))
                .thenComparing(TransferSuggestionDTO::getConfidence, Comparator.reverseOrder()));

        return suggestions;
    }

    /**
     * Create a new transfer suggestion and save it to the database.
     */
    @Transactional
    public Object createSuggestion(CreateTransferSuggestionRequest request) {
        if (request.getFromStoreId() == null || request.getToStoreId() == null ||
                request.getProductId() == null || request.getQuantity() == null) {
            throw new IllegalArgumentException("fromStoreId, toStoreId, productId, and quantity are required");
        }

        if (request.getFromStoreId().equals(request.getToStoreId())) {
            throw new IllegalArgumentException("fromStoreId and toStoreId must be different");
        }

        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }

        // Validate stores and product exist
        if (!storeRepository.existsById(request.getFromStoreId())) {
            throw new IllegalArgumentException("fromStoreId does not exist");
        }
        if (!storeRepository.existsById(request.getToStoreId())) {
            throw new IllegalArgumentException("toStoreId does not exist");
        }
        if (!productRepository.existsById(request.getProductId())) {
            throw new IllegalArgumentException("productId does not exist");
        }

        int confidence = request.getConfidence() != null ? request.getConfidence() : 70;

        // Check settings and rules
        if (settingsService != null) {
            // 1. Confidence threshold check
            int minAccept = settingsService.getInt("confidence.minAccept");
            if (confidence < minAccept) {
                // If confidence is too low, we simply ignore this suggestion (or throw)
                // Returning null or a specific message is a design choice.
                // Here we throw to inform why it wasn't created.
                throw new IllegalArgumentException(
                        "Confidence " + confidence + "% is below minimum acceptance threshold (" + minAccept + "%)");
            }

            // 2. Quantity constraints
            int minQty = settingsService.getInt("quantity.min");
            int maxQty = settingsService.getInt("quantity.max");
            String behavior = settingsService.getString("quantity.constraintBehavior"); // CLAMP or BLOCK

            if ("BLOCK".equalsIgnoreCase(behavior)) {
                if (minQty > 0 && request.getQuantity() < minQty) {
                    throw new IllegalArgumentException(
                            "Quantity " + request.getQuantity() + " is below minimum (" + minQty + ")");
                }
                if (maxQty > 0 && request.getQuantity() > maxQty) {
                    throw new IllegalArgumentException(
                            "Quantity " + request.getQuantity() + " exceeds maximum (" + maxQty + ")");
                }
            } else {
                // Default: CLAMP
                if (minQty > 0 && request.getQuantity() < minQty)
                    request.setQuantity(minQty);
                if (maxQty > 0 && request.getQuantity() > maxQty)
                    request.setQuantity(maxQty);
            }

            // 3. Safety Stock Rules
            if (settingsService.getBoolean("stock.safety.enabled")) {
                // Check donor stock
                com.inventory.orchestrator.entity.Stock donorStock = stockRepository.findByIdStoreAndIdProduct(
                        request.getFromStoreId(), request.getProductId());

                int currentStock = donorStock != null ? donorStock.getQuantity() : 0;
                int minSafetyQty = settingsService.getInt("stock.safety.minQty");

                // Rule A: Absolute min quantity
                if (currentStock - request.getQuantity() < minSafetyQty) {
                    throw new IllegalArgumentException(
                            "Safety Rule: Transfer would leave donor store with less than " + minSafetyQty + " units.");
                }

                // Rule B: Days of Cover (requires sales history)
                int safetyDays = settingsService.getInt("stock.safety.days");
                if (safetyDays > 0) {
                    // We need avg sales for this store/product.
                    // This is expensive if calculated on the fly. Ideally passed in or cached.
                    // For now, let's skip strict Days of Cover check here to avoid circular
                    // dependency or complex injection,
                    // OR we accept the cost. Let's assume we can get it from
                    // StockService/SalesRepository if available.
                    // TODO: Implement Days of Cover check efficiently.
                    // For now, let's rely on absolute min qty which is the most critical safety
                    // net.
                }
            }

            // 4. Auto approve
            boolean autoApproveEnabled = settingsService.getBoolean("transfer.autoApprove.enabled");
            int autoApproveThreshold = settingsService.getInt("transfer.autoApprove.threshold");

            if (autoApproveEnabled && confidence >= autoApproveThreshold) {
                // Create TRANSFER directly
                Transfer t = new Transfer(
                        LocalDateTime.now(),
                        request.getFromStoreId(),
                        request.getToStoreId(),
                        request.getProductId(),
                        "Auto-approved: "
                                + (request.getReason() != null ? request.getReason() : "High confidence suggestion"),
                        request.getQuantity(),
                        "approved");
                t.setConfidence(confidence);
                t.setAutoApproved(true);
                return transferRepository.save(t);
            }
        }

        TransferSuggestion suggestion = new TransferSuggestion(
                request.getFromStoreId(),
                request.getToStoreId(),
                request.getProductId(),
                request.getQuantity(),
                request.getPriority() != null ? request.getPriority() : "medium",
                request.getReason(),
                confidence);

        return suggestionRepository.save(suggestion);
    }

    private static int priorityOrder(String p) {
        if ("high".equals(p))
            return 3;
        if ("medium".equals(p))
            return 2;
        return 1;
    }

    /**
     * Approve a suggestion: create the actual transfer. Quantity is optional (uses
     * suggestion quantity if not provided).
     * Can use either suggestionId string (format:
     * "fromStoreId-toStoreId-productId") or entity ID.
     */
    @Transactional
    public Transfer approveSuggestion(String suggestionId, Integer quantityOverride) {
        long[] ids = parseSuggestionId(suggestionId);
        if (ids == null) {
            throw new IllegalArgumentException("Invalid suggestion id: " + suggestionId);
        }
        long fromStoreId = ids[0];
        long toStoreId = ids[1];
        long productId = ids[2];

        // Try to find the suggestion in the database
        List<TransferSuggestion> suggestions = suggestionRepository.findByFromStoreIdAndToStoreIdAndProductId(
                fromStoreId, toStoreId, productId);

        TransferSuggestion suggestion = suggestions.isEmpty() ? null : suggestions.get(0);

        int quantity;
        if (quantityOverride != null && quantityOverride > 0) {
            quantity = quantityOverride;
        } else if (suggestion != null) {
            quantity = suggestion.getQuantity();
        } else {
            // Fallback: try to get from computed suggestions
            List<TransferSuggestionDTO> list = getSuggestions();
            TransferSuggestionDTO dto = list.stream()
                    .filter(s -> suggestionId.equals(s.getId()))
                    .findFirst()
                    .orElse(null);
            quantity = (dto != null && dto.getQuantity() != null) ? dto.getQuantity() : 1;
        }

        if (quantity <= 0)
            quantity = 1;

        Transfer t = new Transfer(
                LocalDateTime.now(),
                fromStoreId,
                toStoreId,
                productId,
                suggestion != null && suggestion.getReason() != null
                        ? "Approved: " + suggestion.getReason()
                        : "Approved transfer suggestion",
                quantity,
                "approved" // Status: approved (will move to in_transit later)
        );

        Transfer saved = transferRepository.save(t);

        // Optionally delete the suggestion after approval
        if (suggestion != null) {
            suggestionRepository.delete(suggestion);
        }

        return saved;
    }

    /**
     * Reject/dismiss a suggestion: create a transfer record with status "rejected"
     * (with note), then delete the suggestion.
     */
    @Transactional
    public Transfer rejectSuggestion(String suggestionId, String note) {
        long[] ids = parseSuggestionId(suggestionId);
        if (ids == null) {
            throw new IllegalArgumentException("Invalid suggestion id: " + suggestionId);
        }
        long fromStoreId = ids[0];
        long toStoreId = ids[1];
        long productId = ids[2];

        List<TransferSuggestion> suggestions = suggestionRepository.findByFromStoreIdAndToStoreIdAndProductId(
                fromStoreId, toStoreId, productId);
        TransferSuggestion suggestion = suggestions.isEmpty() ? null : suggestions.get(0);

        int quantity = (suggestion != null && suggestion.getQuantity() != null && suggestion.getQuantity() > 0)
                ? suggestion.getQuantity()
                : 1;

        String reason = (note != null && !note.trim().isEmpty())
                ? "Rejected: " + note.trim()
                : "Rejected transfer suggestion";

        Transfer t = new Transfer(
                LocalDateTime.now(),
                fromStoreId,
                toStoreId,
                productId,
                reason,
                quantity,
                "rejected");
        Transfer saved = transferRepository.save(t);

        if (suggestion != null) {
            suggestionRepository.delete(suggestion);
        }

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

        Long getStoreId() {
            return storeId;
        }

        String getStoreName() {
            return storeName;
        }

        Long getProductId() {
            return productId;
        }

        String getProductName() {
            return productName;
        }

        String getSku() {
            return sku;
        }

        int getQuantity() {
            return quantity;
        }
    }
}
