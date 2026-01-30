package com.inventory.orchestrator.ai;

/**
 * User intent from chat message. Used by AI Agent to route behavior.
 */
public enum IntentType {
    BALANCE_STOCK,
    SUGGEST_TRANSFERS,
    EXPLAIN_STORE_LOW,
    EXPLAIN_PROPOSAL,
    SIMULATE_TRANSFER,
    UNKNOWN
}
