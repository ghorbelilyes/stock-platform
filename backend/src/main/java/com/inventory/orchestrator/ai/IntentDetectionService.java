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
        if (m.contains("stock") || m.contains("transfer") || m.contains("imbalance")) return IntentType.SUGGEST_TRANSFERS;
        return IntentType.UNKNOWN;
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
}
