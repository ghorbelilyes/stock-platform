package com.inventory.orchestrator.dto;

/**
 * Request body for creating a transfer suggestion.
 */
public class CreateTransferSuggestionRequest {

    private Long fromStoreId;
    private Long toStoreId;
    private Long productId;
    private Integer quantity;
    private String priority; // "high" | "medium" | "low"
    private String reason;
    private Integer confidence; // 0-100

    public CreateTransferSuggestionRequest() {
    }

    public Long getFromStoreId() {
        return fromStoreId;
    }

    public void setFromStoreId(Long fromStoreId) {
        this.fromStoreId = fromStoreId;
    }

    public Long getToStoreId() {
        return toStoreId;
    }

    public void setToStoreId(Long toStoreId) {
        this.toStoreId = toStoreId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getConfidence() {
        return confidence;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence;
    }
}
