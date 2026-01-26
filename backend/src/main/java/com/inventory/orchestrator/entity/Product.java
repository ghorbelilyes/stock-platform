package com.inventory.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "product")
public class Product {
    
    @Id
    @Column(name = "id", nullable = false)
    private Long id;
    
    @Column(name = "code_barre", nullable = false, unique = true)
    private String codeBarre;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Many-to-one relationship with Category
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;
    
    // Bidirectional relationships
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Stock> stocks = new java.util.ArrayList<>();
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Sales> sales = new java.util.ArrayList<>();
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Transfer> transfers = new java.util.ArrayList<>();
    
    public Product() {
    }
    
    public Product(String codeBarre, String name, String description) {
        // ID equals code_barre (parsed as Long)
        this.id = Long.parseLong(codeBarre);
        this.codeBarre = codeBarre;
        this.name = name;
        this.description = description;
    }
    
    public Product(Long id, String codeBarre, String name, String description) {
        this.id = id;
        this.codeBarre = codeBarre;
        this.name = name;
        this.description = description;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCodeBarre() {
        return codeBarre;
    }
    
    public void setCodeBarre(String codeBarre) {
        this.codeBarre = codeBarre;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    public java.util.List<Stock> getStocks() {
        return stocks;
    }
    
    public void setStocks(java.util.List<Stock> stocks) {
        this.stocks = stocks;
    }
    
    public java.util.List<Sales> getSales() {
        return sales;
    }
    
    public void setSales(java.util.List<Sales> sales) {
        this.sales = sales;
    }
    
    public java.util.List<Transfer> getTransfers() {
        return transfers;
    }
    
    public void setTransfers(java.util.List<Transfer> transfers) {
        this.transfers = transfers;
    }
}
