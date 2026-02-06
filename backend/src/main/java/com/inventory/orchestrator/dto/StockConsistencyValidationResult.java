package com.inventory.orchestrator.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of stock consistency validation.
 * Validates that stock changes are consistent with sales and transfers.
 * Also identifies which records are new vs updates.
 */
public class StockConsistencyValidationResult {
    private Boolean valid;
    private List<String> errors = new ArrayList<>();
    private String message;
    
    // Record analysis
    private Integer newSalesRecords = 0;
    private Integer updateSalesRecords = 0;
    private Integer newTransferRecords = 0;
    private Integer updateTransferRecords = 0;
    private Integer updateStockRecords = 0;
    
    private List<String> newSalesDetails = new ArrayList<>();
    private List<String> updateSalesDetails = new ArrayList<>();
    private List<String> newTransferDetails = new ArrayList<>();
    private List<String> updateTransferDetails = new ArrayList<>();
    
    public StockConsistencyValidationResult() {
        this.valid = true;
        this.errors = new ArrayList<>();
        this.newSalesDetails = new ArrayList<>();
        this.updateSalesDetails = new ArrayList<>();
        this.newTransferDetails = new ArrayList<>();
        this.updateTransferDetails = new ArrayList<>();
    }
    
    public StockConsistencyValidationResult(Boolean valid, List<String> errors, String message) {
        this.valid = valid;
        this.errors = errors != null ? errors : new ArrayList<>();
        this.message = message;
        this.newSalesDetails = new ArrayList<>();
        this.updateSalesDetails = new ArrayList<>();
        this.newTransferDetails = new ArrayList<>();
        this.updateTransferDetails = new ArrayList<>();
    }
    
    public Boolean getValid() {
        return valid;
    }
    
    public void setValid(Boolean valid) {
        this.valid = valid;
    }
    
    public List<String> getErrors() {
        return errors;
    }
    
    public void setErrors(List<String> errors) {
        this.errors = errors != null ? errors : new ArrayList<>();
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Integer getNewSalesRecords() {
        return newSalesRecords;
    }
    
    public void setNewSalesRecords(Integer newSalesRecords) {
        this.newSalesRecords = newSalesRecords;
    }
    
    public Integer getUpdateSalesRecords() {
        return updateSalesRecords;
    }
    
    public void setUpdateSalesRecords(Integer updateSalesRecords) {
        this.updateSalesRecords = updateSalesRecords;
    }
    
    public Integer getNewTransferRecords() {
        return newTransferRecords;
    }
    
    public void setNewTransferRecords(Integer newTransferRecords) {
        this.newTransferRecords = newTransferRecords;
    }
    
    public Integer getUpdateTransferRecords() {
        return updateTransferRecords;
    }
    
    public void setUpdateTransferRecords(Integer updateTransferRecords) {
        this.updateTransferRecords = updateTransferRecords;
    }
    
    public Integer getUpdateStockRecords() {
        return updateStockRecords;
    }
    
    public void setUpdateStockRecords(Integer updateStockRecords) {
        this.updateStockRecords = updateStockRecords;
    }
    
    public List<String> getNewSalesDetails() {
        return newSalesDetails;
    }
    
    public void setNewSalesDetails(List<String> newSalesDetails) {
        this.newSalesDetails = newSalesDetails != null ? newSalesDetails : new ArrayList<>();
    }
    
    public List<String> getUpdateSalesDetails() {
        return updateSalesDetails;
    }
    
    public void setUpdateSalesDetails(List<String> updateSalesDetails) {
        this.updateSalesDetails = updateSalesDetails != null ? updateSalesDetails : new ArrayList<>();
    }
    
    public List<String> getNewTransferDetails() {
        return newTransferDetails;
    }
    
    public void setNewTransferDetails(List<String> newTransferDetails) {
        this.newTransferDetails = newTransferDetails != null ? newTransferDetails : new ArrayList<>();
    }
    
    public List<String> getUpdateTransferDetails() {
        return updateTransferDetails;
    }
    
    public void setUpdateTransferDetails(List<String> updateTransferDetails) {
        this.updateTransferDetails = updateTransferDetails != null ? updateTransferDetails : new ArrayList<>();
    }
}
