package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.FileMappingConfigDTO;
import com.inventory.orchestrator.dto.ValidationResult;
import com.inventory.orchestrator.entity.FileType;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class CsvProcessingService {
    
    /**
     * Parse CSV file and extract headers
     */
    public List<String> parseHeaders(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader)) {
            
            return new ArrayList<>(parser.getHeaderNames());
        }
    }
    
    /**
     * Get row count from CSV file
     */
    public int getRowCount(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.parse(reader)) {
            
            int count = 0;
            for (CSVRecord record : parser) {
                if (!record.isConsistent() || record.size() == 0) continue;
                count++;
            }
            return count - 1; // Subtract header row
        }
    }
    
    /**
     * Process CSV file and return rows as maps
     */
    public List<Map<String, String>> processCsvFile(MultipartFile file) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader)) {
            
            for (CSVRecord record : parser) {
                if (record.size() == 0) continue;
                
                Map<String, String> row = new HashMap<>();
                for (String header : parser.getHeaderNames()) {
                    row.put(header, record.get(header));
                }
                rows.add(row);
            }
        }
        
        return rows;
    }
    
    /**
     * Validate CSV data against mapping
     */
    public ValidationResult validateCsvData(
        MultipartFile file,
        FileMappingConfigDTO mappingConfig,
        FileType fileType
    ) throws Exception {
        ValidationResult result = new ValidationResult();
        result.setValid(true);
        result.setErrors(new ArrayList<>());
        result.setValidRows(0);
        result.setInvalidRows(0);
        
        List<Map<String, String>> rows = processCsvFile(file);
        result.setRowCount(rows.size());
        
        int rowNumber = 1;
        for (Map<String, String> row : rows) {
            rowNumber++;
            boolean rowValid = true;
            
            // Validate required columns
            for (var mapping : mappingConfig.getMappings()) {
                if (mapping.getRequired()) {
                    String fileColumn = mapping.getFileColumn();
                    if (fileColumn == null || fileColumn.isEmpty() || 
                        !row.containsKey(fileColumn) || 
                        row.get(fileColumn) == null || 
                        row.get(fileColumn).trim().isEmpty()) {
                        result.getErrors().add("Row " + rowNumber + ": Required column '" + 
                            mapping.getBackendColumn() + "' is missing or empty");
                        rowValid = false;
                    }
                }
            }
            
            if (rowValid) {
                result.setValidRows(result.getValidRows() + 1);
            } else {
                result.setInvalidRows(result.getInvalidRows() + 1);
            }
        }
        
        if (result.getInvalidRows() > 0) {
            result.setValid(false);
        }
        
        return result;
    }
}
