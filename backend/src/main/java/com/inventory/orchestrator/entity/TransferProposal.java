package com.inventory.orchestrator.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "transfer_proposal")
public class TransferProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @Column(name = "from_store_id", nullable = false)
    private Long fromStoreId;

    @Column(name = "to_store_id", nullable = false)
    private Long toStoreId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Double confidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferProposalStatus status = TransferProposalStatus.PROPOSED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public TransferProposal() {
    }

    public TransferProposal(Long fromStoreId, Long toStoreId, Long productId, Integer quantity,
                            String reason, Double confidence) {
        this.fromStoreId = fromStoreId;
        this.toStoreId = toStoreId;
        this.productId = productId;
        this.quantity = quantity;
        this.reason = reason;
        this.confidence = confidence;
        this.status = TransferProposalStatus.PROPOSED;
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

    public TransferProposalStatus getStatus() {
        return status;
    }

    public void setStatus(TransferProposalStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
