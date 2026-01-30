package com.inventory.orchestrator.ai;

import com.inventory.orchestrator.dto.ai.AiChatResponse;
import com.inventory.orchestrator.dto.ai.TransferProposalView;
import com.inventory.orchestrator.entity.TransferProposal;
import com.inventory.orchestrator.entity.TransferProposalStatus;
import com.inventory.orchestrator.service.ProductService;
import com.inventory.orchestrator.service.StoreService;
import com.inventory.orchestrator.service.TransferProposalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * AI Agent: understands intent, analyzes stock, proposes transfers.
 * NEVER creates Transfer or modifies Stock; only creates TransferProposal.
 * Human approval required for execution.
 */
@Service
public class AiOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestratorService.class);

    private final IntentDetectionService intentDetectionService;
    private final StockAnalysisService stockAnalysisService;
    private final TransferProposalService transferProposalService;
    private final StoreService storeService;
    private final ProductService productService;
    private final LlmClient llmClient;

    public AiOrchestratorService(IntentDetectionService intentDetectionService,
                                 StockAnalysisService stockAnalysisService,
                                 TransferProposalService transferProposalService,
                                 StoreService storeService,
                                 ProductService productService,
                                 LlmClient llmClient) {
        this.intentDetectionService = intentDetectionService;
        this.stockAnalysisService = stockAnalysisService;
        this.transferProposalService = transferProposalService;
        this.storeService = storeService;
        this.productService = productService;
        this.llmClient = llmClient;
    }

    @Transactional(readOnly = true)
    public AiChatResponse process(String userMessage) {
        log.info("AI decision: chat request, message length={}", userMessage != null ? userMessage.length() : 0);
        IntentType intent = intentDetectionService.detect(userMessage);
        log.info("AI decision: intent={}", intent);

        switch (intent) {
            case BALANCE_STOCK:
            case SUGGEST_TRANSFERS:
                return suggestTransfers(userMessage);
            case EXPLAIN_STORE_LOW:
                return explainStoreLow(userMessage);
            case EXPLAIN_PROPOSAL:
                return explainProposal(userMessage);
            case SIMULATE_TRANSFER:
                return simulateTransfer(userMessage);
            default:
                return handleUnknown(userMessage);
        }
    }

    private AiChatResponse suggestTransfers(String userMessage) {
        List<TransferProposalView> proposals = buildProposals();
        if (proposals.isEmpty()) {
            List<StockAnalysisResult> lowStocks = stockAnalysisService.getLowStocks();
            if (lowStocks.isEmpty()) {
                return new AiChatResponse(
                        "Stock is already balanced",
                        "No store-product combinations are below minimum quantity. No transfer proposals generated.",
                        List.of()
                );
            }
            return new AiChatResponse(
                    "No transfer proposals possible",
                    "Low stock detected but no warehouse or store has sufficient excess for the same product.",
                    List.of()
            );
        }
        List<TransferProposalView> created = new ArrayList<>();
        for (TransferProposalView v : proposals) {
            try {
                TransferProposal p = transferProposalService.create(
                        v.getFromStoreId(), v.getToStoreId(), v.getProductId(),
                        v.getQuantity(), v.getReason(), v.getConfidence()
                );
                created.add(transferProposalService.toView(p));
            } catch (Exception e) {
                log.warn("Could not create proposal: {}", e.getMessage());
            }
        }
        String summary = "Generated " + created.size() + " transfer proposal(s). Review and accept to execute.";
        StringBuilder analysis = new StringBuilder("Low stock positions addressed. Proposals: ").append(created.size()).append(". ");
        String llmAnalysis = llmClient.explain(analysis.toString(), userMessage);
        if (llmAnalysis != null) analysis.append(llmAnalysis);
        log.info("AI proposals created: count={}", created.size());
        return new AiChatResponse(summary, analysis.toString(), created);
    }

    /**
     * Build transfer proposal views from stock analysis. Does not persist.
     * Tracks allocated excess per (fromStore, product) so we never exceed available.
     */
    private List<TransferProposalView> buildProposals() {
        List<StockAnalysisResult> lowStocks = stockAnalysisService.getLowStocks();
        if (lowStocks.isEmpty()) return List.of();

        Map<String, Integer> allocatedExcess = new HashMap<>();

        List<TransferProposalView> proposals = new ArrayList<>();
        for (StockAnalysisResult low : lowStocks) {
            Long productId = low.getProductId();
            Long toStoreId = low.getStoreId();
            int needed = (int) Math.ceil(low.getNeededQty());
            if (needed <= 0) continue;

            List<StockAnalysisResult> warehouseExcess = stockAnalysisService.getExcessWarehousesForProduct(productId);
            List<StockAnalysisResult> storeExcess = stockAnalysisService.getExcessStoresForProduct(productId);
            List<StockAnalysisResult> sources = new ArrayList<>(warehouseExcess);
            sources.addAll(storeExcess);

            int remainingNeeded = needed;
            for (StockAnalysisResult src : sources) {
                if (remainingNeeded <= 0) break;
                if (src.getStoreId().equals(toStoreId)) continue;
                String key = src.getStoreId() + ":" + productId;
                int totalExcess = (int) Math.floor(src.getExcessQty());
                int alreadyAllocated = allocatedExcess.getOrDefault(key, 0);
                int available = Math.max(0, totalExcess - alreadyAllocated);
                if (available <= 0) continue;

                int qty = Math.min(remainingNeeded, available);
                if (qty <= 0) continue;

                allocatedExcess.put(key, alreadyAllocated + qty);

                String fromType = storeService.findById(src.getStoreId()).map(s -> s.getType()).orElse("store");
                String reason = buildReason(toStoreId, src.getStoreId(), productId, qty, fromType);
                double confidence = Math.min(1.0, 0.7 + (fromType.equalsIgnoreCase("warehouse") ? 0.2 : 0.0));

                TransferProposalView v = new TransferProposalView(
                        src.getStoreId(), toStoreId, productId, qty, reason, confidence
                );
                proposals.add(v);
                remainingNeeded -= qty;
            }
        }
        return proposals;
    }

    private String buildReason(Long toStoreId, Long fromStoreId, Long productId, int qty, String fromType) {
        String toName = storeService.findById(toStoreId).map(s -> s.getName()).orElse("Store " + toStoreId);
        String fromName = storeService.findById(fromStoreId).map(s -> s.getName()).orElse("Store " + fromStoreId);
        String productName = productService.findById(productId).map(p -> p.getName()).orElse("Product " + productId);
        return String.format("%s is below minimum; %s has excess. Transfer %d units of %s from %s to %s.",
                toName, fromName, qty, productName, fromName, toName);
    }

    private AiChatResponse explainStoreLow(String userMessage) {
        Long storeId = intentDetectionService.extractStoreIdFromMessage(userMessage);
        if (storeId == null) {
            return new AiChatResponse(
                    "Store not identified",
                    "Please specify store ID, e.g. 'Why is store 5 low?'",
                    List.of()
            );
        }
        if (storeService.findById(storeId).isEmpty()) {
            return new AiChatResponse(
                    "Store not found",
                    "No store with ID " + storeId + " exists.",
                    List.of()
            );
        }

        List<StockAnalysisResult> all = stockAnalysisService.analyzeAll();
        List<StockAnalysisResult> forStore = all.stream()
                .filter(r -> r.getStoreId().equals(storeId))
                .filter(r -> r.getStatus() == StockStatus.LOW)
                .toList();

        if (forStore.isEmpty()) {
            return new AiChatResponse(
                    "No low stock at this store",
                    "Store " + storeId + " has no product below minimum quantity.",
                    List.of()
            );
        }

        StringBuilder ctx = new StringBuilder();
        for (StockAnalysisResult r : forStore) {
            ctx.append("Product ").append(r.getProductId())
                    .append(": qty=").append(r.getQuantity())
                    .append(", min=").append(String.format("%.1f", r.getMinQty()))
                    .append(", avgDailySales=").append(String.format("%.2f", r.getAvgDailySales()))
                    .append(". ");
        }
        String explanation = llmClient.explain(ctx.toString(), userMessage);
        return new AiChatResponse(
                "Store " + storeId + " has " + forStore.size() + " product(s) below minimum.",
                explanation != null ? explanation : ctx.toString(),
                List.of()
        );
    }

    private AiChatResponse explainProposal(String userMessage) {
        Long proposalId = intentDetectionService.extractProposalIdFromMessage(userMessage);
        if (proposalId == null) {
            return new AiChatResponse(
                    "Proposal not identified",
                    "Please specify proposal ID, e.g. 'Explain proposal 12'.",
                    List.of()
            );
        }

        Optional<TransferProposal> opt = transferProposalService.findById(proposalId);
        if (opt.isEmpty()) {
            return new AiChatResponse(
                    "Proposal not found",
                    "No proposal with ID " + proposalId + " exists.",
                    List.of()
            );
        }

        TransferProposal p = opt.get();
        String ctx = String.format("Proposal %d: from store %d to store %d, product %d, quantity %d, reason: %s, confidence %.2f.",
                p.getId(), p.getFromStoreId(), p.getToStoreId(), p.getProductId(), p.getQuantity(),
                p.getReason(), p.getConfidence());
        String explanation = llmClient.explain(ctx, userMessage);
        List<TransferProposalView> list = List.of(transferProposalService.toView(p));
        return new AiChatResponse(
                "Proposal " + proposalId + ": " + (p.getReason() != null ? p.getReason() : "transfer suggestion"),
                explanation != null ? explanation : ctx,
                list
        );
    }

    private AiChatResponse simulateTransfer(String userMessage) {
        List<TransferProposalView> proposals = buildProposals();
        String summary = proposals.isEmpty() ? "Simulation: no transfer proposals." : "Simulation: " + proposals.size() + " proposal(s) would be generated. No proposals persisted.";
        StringBuilder analysis = new StringBuilder("No proposals were persisted. ");
        if (!proposals.isEmpty()) {
            analysis.append("Would create ").append(proposals.size()).append(" transfer(s). ");
        }
        String llmAnalysis = llmClient.explain(analysis.toString(), userMessage);
        if (llmAnalysis != null) analysis.append(llmAnalysis);
        return new AiChatResponse(summary, analysis.toString(), proposals);
    }

    private AiChatResponse handleUnknown(String userMessage) {
        String systemPrompt =
                "You are a helpful, friendly assistant for an inventory management system. "
                + "Answer the user naturally: greetings, questions about who you are, general chat, or anything else. "
                + "Keep replies concise but warm. "
                + "When relevant, you can mention that you also help with inventory: e.g. 'suggest transfers' or 'balance stock' for transfer proposals, or 'explain proposal 12' for details. "
                + "Do not refuse to chat; respond to the user's message in a natural way.";
        String reply = llmClient.chat(systemPrompt, userMessage);
        String summary;
        if (reply != null && !reply.isBlank()) {
            summary = reply;
        } else {
            summary = "I'm the inventory assistant. For transfer proposals, say 'suggest transfers' or 'balance stock'. "
                    + "For general chat, set app.ai.llm.endpoint and app.ai.llm.api-key in application.properties.";
        }
        return new AiChatResponse(summary, summary, List.of());
    }
}
