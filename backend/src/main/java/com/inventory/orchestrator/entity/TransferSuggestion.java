package com.inventory.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_suggestion")
public class TransferSuggestion {
    
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
    
    @Column(length = 32)
    private String priority; // "high" | "medium" | "low"
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column
    private Integer confidence; // 0-100
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    @JsonIgnore
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_store_id", insertable = false, updatable = false)
    @JsonIgnore
    private Store fromStore;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_store_id", insertable = false, updatable = false)
    @JsonIgnore
    private Store toStore;
    
    public TransferSuggestion() {
    }
    
    public TransferSuggestion(Long fromStoreId, Long toStoreId, Long productId, Integer quantity, 
                             String priority, String reason, Integer confidence) {
        this.fromStoreId = fromStoreId;
        this.toStoreId = toStoreId;
        this.productId = productId;
        this.quantity = quantity;
        this.priority = priority;
        this.reason = reason;
        this.confidence = confidence;
        this.createdAt = LocalDateTime.now();
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
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public Store getFromStore() {
        return fromStore;
    }
    
    public void setFromStore(Store fromStore) {
        this.fromStore = fromStore;
    }
    
    public Store getToStore() {
        return toStore;
    }
    
    public void setToStore(Store toStore) {
        this.toStore = toStore;
    }
}
