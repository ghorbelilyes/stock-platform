package com.inventory.orchestrator.dto;

import com.inventory.orchestrator.entity.FileType;
import java.util.List;

public class FileMappingConfigDTO {
    private FileType fileType;
    private List<ColumnMappingDTO> mappings;
    
    public FileMappingConfigDTO() {
    }
    
    public FileMappingConfigDTO(FileType fileType, List<ColumnMappingDTO> mappings) {
        this.fileType = fileType;
        this.mappings = mappings;
    }
    
    public FileType getFileType() {
        return fileType;
    }
    
    public void setFileType(FileType fileType) {
        this.fileType = fileType;
    }
    
    public List<ColumnMappingDTO> getMappings() {
        return mappings;
    }
    
    public void setMappings(List<ColumnMappingDTO> mappings) {
        this.mappings = mappings;
    }
}
