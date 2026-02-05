package com.inventory.orchestrator.dto;

/**
 * Request body for approving a transfer suggestion (create the actual transfer).
 */
public class ApproveSuggestionRequest {

    private String suggestionId;
    private Integer quantity;

    public ApproveSuggestionRequest() {
    }

    public String getSuggestionId() {
        return suggestionId;
    }

    public void setSuggestionId(String suggestionId) {
        this.suggestionId = suggestionId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
