package com.inventory.orchestrator.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "file_upload")
public class FileUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private Boolean valid;

    @ElementCollection
    @CollectionTable(name = "file_upload_errors", joinColumns = @JoinColumn(name = "file_upload_id"))
    @Column(name = "error_message")
    private List<String> errors = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String columnMappingJson;

    private Integer rowsProcessed;
    private Integer rowsInserted;
    private Integer rowsUpdated;
    private Integer rowsFailed;

    public FileUpload() {
    }

    public FileUpload(String fileName, FileType fileType, LocalDateTime uploadedAt, Boolean valid) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.uploadedAt = uploadedAt;
        this.valid = valid;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public String getColumnMappingJson() {
        return columnMappingJson;
    }

    public void setColumnMappingJson(String columnMappingJson) {
        this.columnMappingJson = columnMappingJson;
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

    public Integer getRowsUpdated() {
        return rowsUpdated;
    }

    public void setRowsUpdated(Integer rowsUpdated) {
        this.rowsUpdated = rowsUpdated;
    }

    public Integer getRowsFailed() {
        return rowsFailed;
    }

    public void setRowsFailed(Integer rowsFailed) {
        this.rowsFailed = rowsFailed;
    }
}
