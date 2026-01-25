package com.inventory.orchestrator.dto;

public class ColumnMappingDTO {
    private String fileColumn;      // Column name in uploaded file
    private String backendColumn;   // Column name in backend
    private Boolean required;       // Is this column required?
    
    public ColumnMappingDTO() {
    }
    
    public ColumnMappingDTO(String fileColumn, String backendColumn, Boolean required) {
        this.fileColumn = fileColumn;
        this.backendColumn = backendColumn;
        this.required = required;
    }
    
    public String getFileColumn() {
        return fileColumn;
    }
    
    public void setFileColumn(String fileColumn) {
        this.fileColumn = fileColumn;
    }
    
    public String getBackendColumn() {
        return backendColumn;
    }
    
    public void setBackendColumn(String backendColumn) {
        this.backendColumn = backendColumn;
    }
    
    public Boolean getRequired() {
        return required;
    }
    
    public void setRequired(Boolean required) {
        this.required = required;
    }
}
