package com.inventory.orchestrator.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class BulkImportResult {
    private Boolean success;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, ImportResult> results = new HashMap<>();
    private List<String> globalErrors = new ArrayList<>();

    public BulkImportResult() {
        this.timestamp = LocalDateTime.now();
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, ImportResult> getResults() {
        return results;
    }

    public void setResults(Map<String, ImportResult> results) {
        this.results = results;
    }

    public List<String> getGlobalErrors() {
        return globalErrors;
    }

    public void setGlobalErrors(List<String> globalErrors) {
        this.globalErrors = globalErrors;
    }
}
