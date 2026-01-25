package com.inventory.orchestrator.dto;

import com.inventory.orchestrator.entity.FileType;
import java.util.List;

public class RequiredColumnsResponse {
    private FileType fileType;
    private List<String> requiredColumns;
    
    public RequiredColumnsResponse() {
    }
    
    public RequiredColumnsResponse(FileType fileType, List<String> requiredColumns) {
        this.fileType = fileType;
        this.requiredColumns = requiredColumns;
    }
    
    public FileType getFileType() {
        return fileType;
    }
    
    public void setFileType(FileType fileType) {
        this.fileType = fileType;
    }
    
    public List<String> getRequiredColumns() {
        return requiredColumns;
    }
    
    public void setRequiredColumns(List<String> requiredColumns) {
        this.requiredColumns = requiredColumns;
    }
}
