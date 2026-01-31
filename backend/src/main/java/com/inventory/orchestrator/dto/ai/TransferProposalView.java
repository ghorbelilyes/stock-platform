package com.inventory.orchestrator.dto.ai;

/**
 * DTO for a single transfer proposal in AI chat response.
 * Matches the mandatory response format.
 */
public class TransferProposalView {

    private Long id;
    private Long fromStoreId;
    private Long toStoreId;
    private Long productId;
    private Integer quantity;
    private String reason;
    private Double confidence;
    private String status;

    public TransferProposalView() {
    }

    public TransferProposalView(Long fromStoreId, Long toStoreId, Long productId,
                                Integer quantity, String reason, Double confidence) {
        this.fromStoreId = fromStoreId;
        this.toStoreId = toStoreId;
        this.productId = productId;
        this.quantity = quantity;
        this.reason = reason;
        this.confidence = confidence;
    }

    public TransferProposalView(Long id, Long fromStoreId, Long toStoreId, Long productId,
                                Integer quantity, String reason, Double confidence, String status) {
        this.id = id;
        this.fromStoreId = fromStoreId;
        this.toStoreId = toStoreId;
        this.productId = productId;
        this.quantity = quantity;
        this.reason = reason;
        this.confidence = confidence;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
