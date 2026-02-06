package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.ColumnMappingDTO;
import com.inventory.orchestrator.dto.FileMappingConfigDTO;
import com.inventory.orchestrator.dto.ValidationResult;
import com.inventory.orchestrator.entity.FileType;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ColumnMappingService {
    
    private static final Map<FileType, List<String>> REQUIRED_COLUMNS = Map.of(
        FileType.STOCK, Arrays.asList("id_store", "id_product", "quantity"),
        FileType.SALES, Arrays.asList("id_store", "id_product", "quantity", "range_date"),
        FileType.TRANSFER, Arrays.asList("date", "id_store_sent", "id_store_receive", "id_product", "reason", "quantity", "status"),
        FileType.STORE, Arrays.asList("id", "serial_number", "name", "city", "type"),
        FileType.PRODUCT, Arrays.asList("id", "code_barre", "name", "description")
    );
    
    /**
     * Get required columns for a file type
     */
    public List<String> getRequiredColumns(FileType fileType) {
        return new ArrayList<>(REQUIRED_COLUMNS.getOrDefault(fileType, Collections.emptyList()));
    }
    
    /**
     * Transform CSV row using column mapping
     * Map file column names to backend column names
     */
    public Map<String, Object> transformRow(
        Map<String, String> csvRow,
        FileMappingConfigDTO mappingConfig
    ) {
        Map<String, Object> transformedRow = new HashMap<>();
        
        for (ColumnMappingDTO mapping : mappingConfig.getMappings()) {
            String fileColumn = mapping.getFileColumn();
            String backendColumn = mapping.getBackendColumn();
            
            if (fileColumn != null && !fileColumn.isEmpty() && csvRow.containsKey(fileColumn)) {
                String value = csvRow.get(fileColumn);
                if (value != null && !value.trim().isEmpty()) {
                    // Transform value based on backend column type
                    Object transformedValue = transformValue(value, backendColumn);
                    transformedRow.put(backendColumn, transformedValue);
                }
            }
        }
        
        return transformedRow;
    }
    
    /**
     * Transform value based on backend column type
     */
    private Object transformValue(String value, String backendColumn) {
        value = value.trim();
        
        // Handle date/timestamp columns
        if (backendColumn.equals("date") || backendColumn.equals("range_date")) {
            try {
                // Try ISO datetime format first (with time)
                return java.time.LocalDateTime.parse(value);
            } catch (Exception e) {
                try {
                    // Try ISO date format and convert to start of day
                    return java.time.LocalDate.parse(value).atStartOfDay();
                } catch (Exception ex) {
                    try {
                        // Try other common date formats
                        return java.time.LocalDate.parse(value, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay();
                    } catch (Exception exc) {
                        return value; // Return as string if parsing fails
                    }
                }
            }
        }
        
        // Handle numeric ID columns (id, id_store, id_product, etc.)
        if (backendColumn.equals("id") || (backendColumn.contains("id_") && !backendColumn.equals("id"))) {
            try {
                // Parse as Long (numeric ID from client)
                return Long.parseLong(value.trim());
            } catch (NumberFormatException e) {
                return value; // Return as string if parsing fails
            }
        }
        
        // Handle numeric columns (quantity, etc.)
        if (backendColumn.equals("quantity")) {
            try {
                // Remove any non-numeric characters except minus sign
                String numericValue = value.replaceAll("[^0-9-]", "");
                return Integer.parseInt(numericValue);
            } catch (NumberFormatException e) {
                return value; // Return as string if parsing fails
            }
        }
        
        // Handle store type column - normalize to lowercase
        if (backendColumn.equals("type")) {
            return value.toLowerCase().trim();
        }
        
        // Return as string for other columns
        return value;
    }
    
    /**
     * Validate that all required columns are mapped
     */
    public ValidationResult validateMapping(
        FileMappingConfigDTO mappingConfig,
        List<String> fileHeaders
    ) {
        ValidationResult result = new ValidationResult();
        result.setValid(true);
        result.setErrors(new ArrayList<>());
        
        List<String> requiredColumns = getRequiredColumns(mappingConfig.getFileType());
        Set<String> mappedBackendColumns = new HashSet<>();
        
        for (ColumnMappingDTO mapping : mappingConfig.getMappings()) {
            if (mapping.getRequired() && mapping.getFileColumn() != null && !mapping.getFileColumn().isEmpty()) {
                mappedBackendColumns.add(mapping.getBackendColumn());
                
                // Check if file column exists in headers
                if (!fileHeaders.contains(mapping.getFileColumn())) {
                    result.getErrors().add("File column '" + mapping.getFileColumn() + "' not found in CSV headers");
                    result.setValid(false);
                }
            }
        }
        
        // Check if all required columns are mapped
        for (String requiredColumn : requiredColumns) {
            if (!mappedBackendColumns.contains(requiredColumn)) {
                result.getErrors().add("Required column '" + requiredColumn + "' is not mapped");
                result.setValid(false);
            }
        }
        
        return result;
    }
}
