package com.inventory.orchestrator.ai;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Detects user intent from chat message for AI Agent routing.
 * Keyword and pattern based; no hallucination.
 */
@Service
public class IntentDetectionService {

    private static final Pattern STORE_LOW_PATTERN = Pattern.compile("(?i)why\\s+is\\s+store\\s+(\\d+)\\s+low|store\\s+(\\d+)\\s+low|low\\s+store\\s+(\\d+)");
    private static final Pattern PROPOSAL_PATTERN = Pattern.compile("(?i)explain\\s+proposal\\s+(\\d+)|proposal\\s+(\\d+)");
    /** Matches "quantity less than 10", "less then 10" (typo), "stock below 5", etc. */
    private static final Pattern QUERY_STOCK_PATTERN = Pattern.compile("(?i)(?:product|stock|quantity|qty).*?(?:less\\s+(?:than|then)|below|under|<)\\s*(\\d+)|(?:less\\s+(?:than|then)|below|under)\\s*(\\d+).*?(?:product|stock|quantity)");
    /** Matches "quantity more than 10", "more then 10" (typo), "stock above 5", etc. */
    private static final Pattern QUERY_STOCK_MORE_PATTERN = Pattern.compile("(?i)(?:product|stock|quantity|qty).*?(?:more\\s+(?:than|then)|above|greater\\s+(?:than|then)|>)\\s*(\\d+)|(?:more\\s+(?:than|then)|above|greater\\s+(?:than|then))\\s*(\\d+).*?(?:product|stock|quantity)");

    public IntentType detect(String message) {
        if (message == null || message.isBlank()) {
            return IntentType.UNKNOWN;
        }
        String m = message.trim().toLowerCase();
        if (m.contains("balance") && m.contains("stock")) return IntentType.BALANCE_STOCK;
        if (m.contains("suggest") && m.contains("transfer")) return IntentType.SUGGEST_TRANSFERS;
        if (m.contains("transfer") && (m.contains("suggest") || m.contains("propose"))) return IntentType.SUGGEST_TRANSFERS;
        if (STORE_LOW_PATTERN.matcher(message).find()) return IntentType.EXPLAIN_STORE_LOW;
        if (PROPOSAL_PATTERN.matcher(message).find()) return IntentType.EXPLAIN_PROPOSAL;
        if (m.contains("simulate") && m.contains("transfer")) return IntentType.SIMULATE_TRANSFER;
        if (isQueryStockIntent(m, message)) return IntentType.QUERY_STOCK;
        if (m.contains("stock") || m.contains("transfer") || m.contains("imbalance")) return IntentType.SUGGEST_TRANSFERS;
        return IntentType.UNKNOWN;
    }

    private boolean isQueryStockIntent(String lower, String original) {
        if (lower.contains("product") && (lower.contains("quantity") || lower.contains("less") || lower.contains("below") || lower.contains("stock") || lower.contains("more") || lower.contains("above") || lower.contains("greater"))) return true;
        if (lower.contains("show") && (lower.contains("product") || lower.contains("stock")) && (lower.contains("quantity") || lower.contains("less") || lower.contains("<") || lower.contains("more") || lower.contains(">") || lower.contains("above"))) return true;
        if (QUERY_STOCK_PATTERN.matcher(original).find()) return true;
        if (QUERY_STOCK_MORE_PATTERN.matcher(original).find()) return true;
        if (lower.matches(".*(?:quantity|qty|stock)\\s*(?:less|below|under|<).*") || lower.matches(".*(?:less|below|under)\\s+(?:than|then)\\s+\\d+.*")) return true;
        if (lower.matches(".*(?:quantity|qty|stock)\\s*(?:more|above|greater|>).*") || lower.matches(".*(?:more|above|greater)\\s+(?:than|then)\\s+\\d+.*")) return true;
        return false;
    }

    /** True if user asked for quantity *more than* (or above/greater than) a threshold; false for less than/below. Accepts "then" typo. */
    public boolean isQuantityMoreThan(String message) {
        if (message == null) return false;
        String m = message.trim().toLowerCase();
        return m.contains("more than") || m.contains("more then") || m.contains("above") || m.contains("greater than") || m.contains("greater then") || m.contains(">");
    }

    /** True when message has both "more than/then X" and "less than/then Y" (range query). */
    public boolean isRangeQuery(String message) {
        if (message == null) return false;
        String m = message.trim().toLowerCase();
        boolean hasMore = m.contains("more than") || m.contains("more then") || m.contains("above") || m.contains("greater than") || m.contains("greater then") || m.contains(">");
        boolean hasLess = m.contains("less than") || m.contains("less then") || m.contains("below") || m.contains("under") || m.contains("<");
        return hasMore && hasLess;
    }

    /**
     * True when message looks like a stock quantity query but keywords did not match.
     * Used for hybrid: try LLM to extract intent/slots (e.g. "products between 50 and 80").
     */
    public boolean looksLikeStockQuery(String message) {
        if (message == null || message.isBlank()) return false;
        String m = message.trim().toLowerCase();
        boolean hasTopic = m.contains("product") || m.contains("stock") || m.contains("quantity") || m.contains("inventory");
        boolean hasNumber = message.matches(".*\\d+.*");
        return hasTopic && hasNumber;
    }

    public Long extractStoreIdFromMessage(String message) {
        if (message == null) return null;
        var matcher = STORE_LOW_PATTERN.matcher(message);
        if (matcher.find()) {
            for (int g = 1; g <= matcher.groupCount(); g++) {
                String gv = matcher.group(g);
                if (gv != null && !gv.isBlank()) {
                    try {
                        return Long.parseLong(gv.trim());
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return null;
    }

    public Long extractProposalIdFromMessage(String message) {
        if (message == null) return null;
        var matcher = PROPOSAL_PATTERN.matcher(message);
        if (matcher.find()) {
            for (int g = 1; g <= matcher.groupCount(); g++) {
                String gv = matcher.group(g);
                if (gv != null && !gv.isBlank()) {
                    try {
                        return Long.parseLong(gv.trim());
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return null;
    }

    /**
     * Extract max quantity threshold from message for QUERY_STOCK intent.
     * E.g. "products with quantity less than 10" -> 10, "stock below 5" -> 5.
     * Returns null if no number found; caller should use a default (e.g. 10).
     */
    public Integer extractMaxQuantityFromMessage(String message) {
        if (message == null) return null;
        var matcher = QUERY_STOCK_PATTERN.matcher(message);
        if (matcher.find()) {
            for (int g = 1; g <= matcher.groupCount(); g++) {
                String gv = matcher.group(g);
                if (gv != null && !gv.isBlank()) {
                    try {
                        int n = Integer.parseInt(gv.trim());
                        if (n > 0 && n <= 1_000_000) return n;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        // Fallback: look for "less than N" / "less then N" (typo) or "below N" or "< N" anywhere
        Pattern fallback = Pattern.compile("(?i)(?:less\\s+(?:than|then)|below|under|<)\\s*(\\d+)|(\\d+)\\s*(?:or\\s+less|and\\s+below)");
        var fm = fallback.matcher(message);
        if (fm.find()) {
            for (int g = 1; g <= fm.groupCount(); g++) {
                String gv = fm.group(g);
                if (gv != null && !gv.isBlank()) {
                    try {
                        int n = Integer.parseInt(gv.trim());
                        if (n > 0 && n <= 1_000_000) return n;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return null;
    }

    /**
     * Extract min quantity threshold for "more than X" / "above X" queries.
     * E.g. "products with quantity more than 10" -> 10.
     */
    public Integer extractMinQuantityFromMessage(String message) {
        if (message == null) return null;
        var matcher = QUERY_STOCK_MORE_PATTERN.matcher(message);
        if (matcher.find()) {
            for (int g = 1; g <= matcher.groupCount(); g++) {
                String gv = matcher.group(g);
                if (gv != null && !gv.isBlank()) {
                    try {
                        int n = Integer.parseInt(gv.trim());
                        if (n >= 0 && n <= 1_000_000) return n;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        // Fallback: "more than 100", "more then 100" (typo), "above 100", etc.
        Pattern fallback = Pattern.compile("(?i)(?:more\\s+(?:than|then)|above|greater\\s+(?:than|then)|>)\\s*(\\d+)");
        var fm = fallback.matcher(message);
        if (fm.find()) {
            String gv = fm.group(1);
            if (gv != null && !gv.isBlank()) {
                try {
                    int n = Integer.parseInt(gv.trim());
                    if (n >= 0 && n <= 1_000_000) return n;
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return null;
    }
}
