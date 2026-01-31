package com.inventory.orchestrator.ai;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.dto.ai.AiChatResponse;
import com.inventory.orchestrator.dto.ai.TransferProposalView;
import com.inventory.orchestrator.entity.TransferProposal;
import com.inventory.orchestrator.entity.TransferProposalStatus;
import com.inventory.orchestrator.service.ProductService;
import com.inventory.orchestrator.service.StockService;
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
    private final StockService stockService;
    private final LlmClient llmClient;

    public AiOrchestratorService(IntentDetectionService intentDetectionService,
                                 StockAnalysisService stockAnalysisService,
                                 TransferProposalService transferProposalService,
                                 StoreService storeService,
                                 ProductService productService,
                                 StockService stockService,
                                 LlmClient llmClient) {
        this.intentDetectionService = intentDetectionService;
        this.stockAnalysisService = stockAnalysisService;
        this.transferProposalService = transferProposalService;
        this.storeService = storeService;
        this.productService = productService;
        this.stockService = stockService;
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
                log.info("AI decision: path=KEYWORD (suggest/balance), no LLM for routing");
                return suggestTransfers(userMessage);
            case EXPLAIN_STORE_LOW:
                log.info("AI decision: path=KEYWORD (explain store low), LLM only for explanation");
                return explainStoreLow(userMessage);
            case EXPLAIN_PROPOSAL:
                log.info("AI decision: path=KEYWORD (explain proposal), LLM only for explanation");
                return explainProposal(userMessage);
            case SIMULATE_TRANSFER:
                log.info("AI decision: path=KEYWORD (simulate), LLM only for analysis");
                return simulateTransfer(userMessage);
            case QUERY_STOCK:
                log.info("AI decision: path=KEYWORD_QUERY_STOCK (less/more/between), no LLM for query");
                return handleQueryStock(userMessage);
            default:
                log.info("AI decision: path=UNKNOWN, checking hybrid then handleUnknown");
                if (intentDetectionService.looksLikeStockQuery(userMessage) && llmClient.isConfigured()) {
                    log.info("AI decision: message looks like stock query, calling LLM for classification (hybrid)");
                    AiChatResponse llmResult = tryLlmStockQuery(userMessage);
                    if (llmResult != null) {
                        log.info("AI decision: hybrid LLM classification succeeded, returning stock result");
                        return llmResult;
                    }
                    log.info("AI decision: hybrid LLM classification failed or returned UNKNOWN, falling back to handleUnknown");
                } else if (intentDetectionService.looksLikeStockQuery(userMessage) && !llmClient.isConfigured()) {
                    log.info("AI decision: message looks like stock query but LLM not configured, skipping hybrid");
                }
                return handleUnknown(userMessage);
        }
    }

    /**
     * Hybrid fallback: when intent is UNKNOWN but message looks like a stock query, ask LLM to classify.
     * Returns null if LLM not configured, parse fails, or LLM says UNKNOWN.
     */
    private AiChatResponse tryLlmStockQuery(String userMessage) {
        String systemPrompt = "You are an intent classifier for inventory stock queries. "
                + "Reply with exactly ONE line, nothing else. Use only: RANGE min max | LESS max | MORE min | UNKNOWN. "
                + "Use only integers. Examples: RANGE 50 80 (quantity between 50 and 80), LESS 10 (quantity less than 10), MORE 100 (quantity more than 100). "
                + "If the user asks for products/stock between two numbers (e.g. between 50 and 80, from 50 to 80), reply RANGE and the two numbers (smaller first). "
                + "If unclear or not a quantity query, reply UNKNOWN.";
        String reply = llmClient.chat(systemPrompt, userMessage);
        if (reply == null || reply.isBlank()) {
            log.info("AI decision: hybrid LLM returned null or blank");
            return null;
        }
        log.debug("AI decision: hybrid LLM raw reply={}", reply.trim().length() > 80 ? reply.trim().substring(0, 80) + "..." : reply.trim());
        String line = reply.trim().split("\\n")[0].trim().toUpperCase();
        if (line.startsWith("UNKNOWN")) {
            log.info("AI decision: hybrid LLM replied UNKNOWN");
            return null;
        }
        String[] parts = line.split("\\s+");
        if (parts.length < 2) {
            log.info("AI decision: hybrid LLM parse failed (not enough parts): {}", line);
            return null;
        }
        try {
            switch (parts[0]) {
                case "RANGE":
                    if (parts.length >= 3) {
                        int min = Integer.parseInt(parts[1]);
                        int max = Integer.parseInt(parts[2]);
                        if (min >= 0 && max > min && max <= 1_000_000) {
                            log.info("AI decision: hybrid parsed RANGE min={} max={}", min, max);
                            return handleQueryStockWithSlots(min, max, "RANGE");
                        }
                    }
                    break;
                case "LESS":
                    int max = Integer.parseInt(parts[1]);
                    if (max > 0 && max <= 1_000_000) {
                        log.info("AI decision: hybrid parsed LESS max={}", max);
                        return handleQueryStockWithSlots(null, max, "LESS");
                    }
                    break;
                case "MORE":
                    int min = Integer.parseInt(parts[1]);
                    if (min >= 0 && min <= 1_000_000) {
                        log.info("AI decision: hybrid parsed MORE min={}", min);
                        return handleQueryStockWithSlots(min, null, "MORE");
                    }
                    break;
                default:
                    log.info("AI decision: hybrid LLM unknown type: {}", parts[0]);
            }
        } catch (NumberFormatException e) {
            log.info("AI decision: hybrid LLM parse failed (NumberFormatException): {}", e.getMessage());
        }
        return null;
    }

    /** Run stock query with explicit min/max from LLM (or caller). type: RANGE, LESS, MORE. */
    private AiChatResponse handleQueryStockWithSlots(Integer min, Integer max, String type) {
        List<StockView> rows;
        String summary;
        String analysis;
        if ("RANGE".equals(type) && min != null && max != null && max > min) {
            rows = stockService.findStocksWithQuantityBetween(min, max, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity between " + min + " and " + max + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity between " + min + " and " + max + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries with quantity strictly between " + min + " and " + max + "."
                    : buildStockRowsText(rows, "between " + min + " and " + max);
        } else if ("MORE".equals(type) && min != null) {
            rows = stockService.findStocksWithQuantityGreaterThan(min, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity more than " + min + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity more than " + min + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries above " + min + " in the database."
                    : buildStockRowsText(rows, "above " + min);
        } else if ("LESS".equals(type) && max != null) {
            rows = stockService.findStocksWithQuantityLessThan(max, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity less than " + max + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity less than " + max + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries below " + max + " in the database."
                    : buildStockRowsText(rows, "below " + max);
        } else {
            return null;
        }
        return new AiChatResponse(summary, analysis, List.of(), rows);
    }

    /**
     * Handle QUERY_STOCK: quantity less than X, more than X, or between X and Y (more than X and less than Y).
     */
    private AiChatResponse handleQueryStock(String userMessage) {
        List<StockView> rows;
        String summary;
        String analysis;

        if (intentDetectionService.isRangeQuery(userMessage)) {
            Integer minQ = intentDetectionService.extractMinQuantityFromMessage(userMessage);
            Integer maxQ = intentDetectionService.extractMaxQuantityFromMessage(userMessage);
            if (minQ == null) minQ = 0;
            if (maxQ == null || maxQ <= minQ) maxQ = minQ + 1;
            rows = stockService.findStocksWithQuantityBetween(minQ, maxQ, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity between " + minQ + " and " + maxQ + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity between " + minQ + " and " + maxQ + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries with quantity strictly between " + minQ + " and " + maxQ + "."
                    : buildStockRowsText(rows, "between " + minQ + " and " + maxQ);
        } else if (intentDetectionService.isQuantityMoreThan(userMessage)) {
            Integer minQty = intentDetectionService.extractMinQuantityFromMessage(userMessage);
            if (minQty == null) minQty = 10;
            rows = stockService.findStocksWithQuantityGreaterThan(minQty, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity more than " + minQty + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity more than " + minQty + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries above " + minQty + " in the database."
                    : buildStockRowsText(rows, "above " + minQty);
        } else {
            Integer maxQty = intentDetectionService.extractMaxQuantityFromMessage(userMessage);
            if (maxQty == null) maxQty = 10;
            rows = stockService.findStocksWithQuantityLessThan(maxQty, 500);
            summary = rows.isEmpty()
                    ? "No products with quantity less than " + maxQty + "."
                    : "Found " + rows.size() + " product/store combination(s) with quantity less than " + maxQty + ".";
            analysis = rows.isEmpty()
                    ? "There are no stock entries below " + maxQty + " in the database."
                    : buildStockRowsText(rows, "below " + maxQty);
        }
        return new AiChatResponse(summary, analysis, List.of(), rows);
    }

    private String buildStockRowsText(List<StockView> rows, String thresholdLabel) {
        StringBuilder sb = new StringBuilder();
        sb.append("Here are the stock entries with quantity ").append(thresholdLabel).append(":\n");
        for (StockView row : rows) {
            String productName = row.getProduct() != null ? row.getProduct().getName() : "Product " + row.getIdProduct();
            String storeName = row.getStore() != null ? row.getStore().getName() : "Store " + row.getIdStore();
            sb.append("• ").append(productName).append(" at ").append(storeName).append(": quantity ").append(row.getQuantity());
            if (row.getProduct() != null && row.getProduct().getDescription() != null && !row.getProduct().getDescription().isBlank()) {
                sb.append(" — ").append(row.getProduct().getDescription());
            }
            sb.append("\n");
        }
        sb.append("You can use 'suggest transfers' or 'balance stock' to get transfer proposals for low stock.");
        return sb.toString();
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
        // Avoid LLM call for simple greetings to save quota (e.g. Gemini free tier 20 req/day)
        if (isSimpleGreeting(userMessage)) {
            log.info("AI decision: path=GREETING (no LLM), returning static reply");
            String summary = "Hello! I'm the inventory assistant. You can ask me to show products by quantity (e.g. 'products less than 10' or 'products between 50 and 80'), suggest transfers, or balance stock. How can I help?";
            return new AiChatResponse(summary, summary, List.of());
        }
        log.info("AI decision: path=UNKNOWN_CHAT, calling LLM for general reply");
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
            log.info("AI decision: UNKNOWN_CHAT LLM reply received, length={}", reply.length());
        } else {
            log.info("AI decision: UNKNOWN_CHAT LLM returned null/blank, using fallback text");
            summary = "I'm the inventory assistant. For transfer proposals, say 'suggest transfers' or 'balance stock'. "
                    + "For queries like 'products between 50 and 80', try again later if the service is busy.";
        }
        return new AiChatResponse(summary, summary, List.of());
    }

    /** True for short greetings so we skip LLM and save quota (e.g. Gemini free tier). */
    private boolean isSimpleGreeting(String message) {
        if (message == null || message.isBlank()) return true;
        String m = message.trim();
        if (m.length() > 30) return false;
        String lower = m.toLowerCase();
        return lower.matches("^(hi|hello|hey|yo|good\\s*(morning|afternoon|evening)|howdy|greetings?)\\s*!?\\.?$")
                || lower.equals("how are you")
                || lower.equals("how are you?")
                || lower.equals("what's up")
                || lower.equals("whats up")
                || lower.matches("^hi\\s+there\\s*!?\\.?$");
    }
}
