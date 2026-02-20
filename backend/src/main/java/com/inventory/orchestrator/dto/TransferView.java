package com.inventory.orchestrator.dto;

import java.time.LocalDateTime;

/**
 * DTO for transfer list API: transfer data with source/destination store names
 * and product name.
 */
public class TransferView {

    private Long id;
    private LocalDateTime date;
    private Long idStoreSent;
    private Long idStoreReceive;
    private Long idProduct;
    private String reason;
    private Integer quantity;
    private String status;
    private String sourceStoreName;
    private String destinationStoreName;
    private String productName;
    private Integer confidence;
    private Boolean autoApproved;

    public TransferView(Long id, LocalDateTime date, Long idStoreSent, Long idStoreReceive, Long idProduct,
            String reason, Integer quantity, String status,
            String sourceStoreName, String destinationStoreName, String productName,
            Integer confidence, Boolean autoApproved) {
        this.id = id;
        this.date = date;
        this.idStoreSent = idStoreSent;
        this.idStoreReceive = idStoreReceive;
        this.idProduct = idProduct;
        this.reason = reason;
        this.quantity = quantity;
        this.status = status != null ? status : "in_transit";
        this.sourceStoreName = sourceStoreName != null ? sourceStoreName : "";
        this.destinationStoreName = destinationStoreName != null ? destinationStoreName : "";
        this.productName = productName != null ? productName : "";
        this.confidence = confidence;
        this.autoApproved = autoApproved;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public Long getIdStoreSent() {
        return idStoreSent;
    }

    public void setIdStoreSent(Long idStoreSent) {
        this.idStoreSent = idStoreSent;
    }

    public Long getIdStoreReceive() {
        return idStoreReceive;
    }

    public void setIdStoreReceive(Long idStoreReceive) {
        this.idStoreReceive = idStoreReceive;
    }

    public Long getIdProduct() {
        return idProduct;
    }

    public void setIdProduct(Long idProduct) {
        this.idProduct = idProduct;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSourceStoreName() {
        return sourceStoreName;
    }

    public void setSourceStoreName(String sourceStoreName) {
        this.sourceStoreName = sourceStoreName;
    }

    public String getDestinationStoreName() {
        return destinationStoreName;
    }

    public void setDestinationStoreName(String destinationStoreName) {
        this.destinationStoreName = destinationStoreName;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getConfidence() {
        return confidence;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence;
    }

    public Boolean getAutoApproved() {
        return autoApproved;
    }

    public void setAutoApproved(Boolean autoApproved) {
        this.autoApproved = autoApproved;
    }
}
