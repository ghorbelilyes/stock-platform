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
    /** Products/stock by quantity: less than X, more than X, or between X and Y */
    QUERY_STOCK,
    UNKNOWN
}
