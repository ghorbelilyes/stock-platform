package com.inventory.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales")
public class Sales {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
    
    @Column(name = "range_date", nullable = false)
    private LocalDateTime rangeDate;
    
    @Column(name = "id_store", nullable = false)
    private Long idStore;
    
    @Column(name = "id_product", nullable = false)
    private Long idProduct;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_store", insertable = false, updatable = false)
    private Store store;
    
    public Sales() {
    }
    
    public Sales(LocalDateTime rangeDate, Long idStore, Long idProduct, Integer quantity) {
        this.rangeDate = rangeDate;
        this.idStore = idStore;
        this.idProduct = idProduct;
        this.quantity = quantity;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDateTime getRangeDate() {
        return rangeDate;
    }
    
    public void setRangeDate(LocalDateTime rangeDate) {
        this.rangeDate = rangeDate;
    }
    
    public Long getIdStore() {
        return idStore;
    }
    
    public void setIdStore(Long idStore) {
        this.idStore = idStore;
    }
    
    public Long getIdProduct() {
        return idProduct;
    }
    
    public void setIdProduct(Long idProduct) {
        this.idProduct = idProduct;
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
    
    public Store getStore() {
        return store;
    }
    
    public void setStore(Store store) {
        this.store = store;
    }
}
