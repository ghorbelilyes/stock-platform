package com.inventory.orchestrator.dto;

import com.inventory.orchestrator.entity.FileType;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ImportResult {
    private Long fileUploadId;
    private String fileName;
    private FileType fileType;
    private LocalDateTime uploadedAt;
    private Boolean valid;
    private Integer rowsProcessed;
    private Integer rowsInserted;
    private Integer rowsFailed;
    private List<String> errors = new ArrayList<>();
    
    public ImportResult() {
    }
    
    public ImportResult(Long fileUploadId, String fileName, FileType fileType, LocalDateTime uploadedAt, Boolean valid, Integer rowsProcessed, Integer rowsInserted, Integer rowsFailed, List<String> errors) {
        this.fileUploadId = fileUploadId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.uploadedAt = uploadedAt;
        this.valid = valid;
        this.rowsProcessed = rowsProcessed;
        this.rowsInserted = rowsInserted;
        this.rowsFailed = rowsFailed;
        this.errors = errors != null ? errors : new ArrayList<>();
    }
    
    public Long getFileUploadId() {
        return fileUploadId;
    }
    
    public void setFileUploadId(Long fileUploadId) {
        this.fileUploadId = fileUploadId;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public FileType getFileType() {
        return fileType;
    }
    
    public void setFileType(FileType fileType) {
        this.fileType = fileType;
    }
    
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    
    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
    
    public Boolean getValid() {
        return valid;
    }
    
    public void setValid(Boolean valid) {
        this.valid = valid;
    }
    
    public Integer getRowsProcessed() {
        return rowsProcessed;
    }
    
    public void setRowsProcessed(Integer rowsProcessed) {
        this.rowsProcessed = rowsProcessed;
    }
    
    public Integer getRowsInserted() {
        return rowsInserted;
    }
    
    public void setRowsInserted(Integer rowsInserted) {
        this.rowsInserted = rowsInserted;
    }
    
    public Integer getRowsFailed() {
        return rowsFailed;
    }
    
    public void setRowsFailed(Integer rowsFailed) {
        this.rowsFailed = rowsFailed;
    }
    
    public List<String> getErrors() {
        return errors;
    }
    
    public void setErrors(List<String> errors) {
        this.errors = errors != null ? errors : new ArrayList<>();
    }
}
