package com.inventory.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "transfer")
public class Transfer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(name = "id_store_sent", nullable = false)
    private Long idStoreSent;
    
    @Column(name = "id_store_receive", nullable = false)
    private Long idStoreReceive;
    
    @Column(name = "id_product", nullable = false)
    private Long idProduct;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    @JsonIgnore
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_store_sent", insertable = false, updatable = false)
    @JsonIgnore
    private Store storeSent;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_store_receive", insertable = false, updatable = false)
    @JsonIgnore
    private Store storeReceive;
    
    public Transfer() {
    }
    
    public Transfer(LocalDate date, Long idStoreSent, Long idStoreReceive, Long idProduct, String reason, Integer quantity) {
        this.date = date;
        this.idStoreSent = idStoreSent;
        this.idStoreReceive = idStoreReceive;
        this.idProduct = idProduct;
        this.reason = reason;
        this.quantity = quantity;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
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
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public Store getStoreSent() {
        return storeSent;
    }
    
    public void setStoreSent(Store storeSent) {
        this.storeSent = storeSent;
    }
    
    public Store getStoreReceive() {
        return storeReceive;
    }
    
    public void setStoreReceive(Store storeReceive) {
        this.storeReceive = storeReceive;
    }
}
