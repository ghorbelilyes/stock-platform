package com.inventory.orchestrator.dto;

/**
 * Request body for rejecting/dismissing a transfer suggestion (with optional note).
 */
public class RejectSuggestionRequest {

    private String suggestionId;
    private String note;

    public RejectSuggestionRequest() {
    }

    public String getSuggestionId() {
        return suggestionId;
    }

    public void setSuggestionId(String suggestionId) {
        this.suggestionId = suggestionId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
