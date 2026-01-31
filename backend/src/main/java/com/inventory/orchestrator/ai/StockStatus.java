package com.inventory.orchestrator.ai;

/**
 * Deterministic stock status for (store, product).
 */
public enum StockStatus {
    LOW,    // quantity < minQty
    OK,     // minQty <= quantity <= maxQty
    EXCESS  // quantity > maxQty
}
