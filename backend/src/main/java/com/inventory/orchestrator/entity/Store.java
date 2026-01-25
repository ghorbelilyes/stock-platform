package com.inventory.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "store")
public class Store {
    
    @Id
    @Column(name = "id", nullable = false)
    private Long id;
    
    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false)
    private String type; // "store" or "warehouse"
    
    @Column(name = "lead_time_days")
    private Integer leadTimeDays;
    
    // Bidirectional relationships
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Stock> stocks = new ArrayList<>();
    
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Sales> sales = new ArrayList<>();
    
    @OneToMany(mappedBy = "storeSent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transfer> transfersSent = new ArrayList<>();
    
    @OneToMany(mappedBy = "storeReceive", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transfer> transfersReceived = new ArrayList<>();
    
    public Store() {
    }
    
    public Store(String serialNumber, String name, String city, String type, Integer leadTimeDays) {
        // ID equals serial_number (parsed as Long)
        this.id = Long.parseLong(serialNumber);
        this.serialNumber = serialNumber;
        this.name = name;
        this.city = city;
        this.type = type;
        this.leadTimeDays = leadTimeDays;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSerialNumber() {
        return serialNumber;
    }
    
    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Integer getLeadTimeDays() {
        return leadTimeDays;
    }
    
    public void setLeadTimeDays(Integer leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }
    
    public List<Stock> getStocks() {
        return stocks;
    }
    
    public void setStocks(List<Stock> stocks) {
        this.stocks = stocks;
    }
    
    public List<Sales> getSales() {
        return sales;
    }
    
    public void setSales(List<Sales> sales) {
        this.sales = sales;
    }
    
    public List<Transfer> getTransfersSent() {
        return transfersSent;
    }
    
    public void setTransfersSent(List<Transfer> transfersSent) {
        this.transfersSent = transfersSent;
    }
    
    public List<Transfer> getTransfersReceived() {
        return transfersReceived;
    }
    
    public void setTransfersReceived(List<Transfer> transfersReceived) {
        this.transfersReceived = transfersReceived;
    }
}
