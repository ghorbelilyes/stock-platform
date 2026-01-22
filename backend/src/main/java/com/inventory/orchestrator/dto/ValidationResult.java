package com.inventory.orchestrator.dto;

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private Boolean valid;
    private List<String> errors = new ArrayList<>();
    private Integer rowCount;
    private Integer validRows;
    private Integer invalidRows;
    
    public ValidationResult() {
    }
    
    public ValidationResult(Boolean valid, List<String> errors) {
        this.valid = valid;
        this.errors = errors != null ? errors : new ArrayList<>();
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
    
    public Integer getRowCount() {
        return rowCount;
    }
    
    public void setRowCount(Integer rowCount) {
        this.rowCount = rowCount;
    }
    
    public Integer getValidRows() {
        return validRows;
    }
    
    public void setValidRows(Integer validRows) {
        this.validRows = validRows;
    }
    
    public Integer getInvalidRows() {
        return invalidRows;
    }
    
    public void setInvalidRows(Integer invalidRows) {
        this.invalidRows = invalidRows;
    }
}
