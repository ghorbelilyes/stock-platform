package com.inventory.orchestrator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.orchestrator.dto.*;
import com.inventory.orchestrator.entity.FileType;
import com.inventory.orchestrator.service.ColumnMappingService;
import com.inventory.orchestrator.service.CsvProcessingService;
import com.inventory.orchestrator.service.DataImportService;
import com.inventory.orchestrator.service.StockConsistencyValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class FileController {
    
    private final CsvProcessingService csvProcessingService;
    private final ColumnMappingService columnMappingService;
    private final DataImportService dataImportService;
    private final ObjectMapper objectMapper;
    private final StockConsistencyValidationService stockConsistencyValidationService;
    
    @Autowired
    public FileController(CsvProcessingService csvProcessingService, 
                         ColumnMappingService columnMappingService,
                         DataImportService dataImportService,
                         ObjectMapper objectMapper,
                         StockConsistencyValidationService stockConsistencyValidationService) {
        this.csvProcessingService = csvProcessingService;
        this.columnMappingService = columnMappingService;
        this.dataImportService = dataImportService;
        this.objectMapper = objectMapper;
        this.stockConsistencyValidationService = stockConsistencyValidationService;
    }
    
    @PostMapping("/parse-headers")
    public ResponseEntity<ApiResponse<ParseHeadersResponse>> parseHeaders(
        @RequestParam("file") MultipartFile file
    ) {
        try {
            List<String> headers = csvProcessingService.parseHeaders(file);
            int rowCount = csvProcessingService.getRowCount(file);
            
            ParseHeadersResponse response = new ParseHeadersResponse(headers, rowCount);
            return ResponseEntity.ok(ApiResponse.success(response, "Headers parsed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("PARSE_ERROR", "Failed to parse CSV headers", List.of(e.getMessage())));
        }
    }
    
    @GetMapping("/required-columns/{fileType}")
    public ResponseEntity<ApiResponse<RequiredColumnsResponse>> getRequiredColumns(
        @PathVariable String fileType
    ) {
        try {
            FileType type = FileType.valueOf(fileType.toUpperCase());
            List<String> requiredColumns = columnMappingService.getRequiredColumns(type);
            
            RequiredColumnsResponse response = new RequiredColumnsResponse(type, requiredColumns);
            return ResponseEntity.ok(ApiResponse.success(response, "Required columns retrieved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_FILE_TYPE", "Invalid file type", List.of()));
        }
    }
    
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidationResult>> validateFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam("fileType") String fileTypeStr,
        @RequestParam("columnMapping") String columnMappingJson
    ) {
        try {
            FileType fileType = FileType.valueOf(fileTypeStr.toUpperCase());
            FileMappingConfigDTO mappingConfig = objectMapper.readValue(columnMappingJson, FileMappingConfigDTO.class);
            
            ValidationResult result = csvProcessingService.validateCsvData(file, mappingConfig, fileType);
            
            return ResponseEntity.ok(ApiResponse.success(result, "File validated successfully"));
        } catch (Exception e) {
            ValidationResult errorResult = new ValidationResult();
            errorResult.setValid(false);
            errorResult.setErrors(List.of(e.getMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.success(errorResult, "Validation failed"));
        }
    }
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ImportResult>> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam("fileType") String fileTypeStr,
        @RequestParam("columnMapping") String columnMappingJson
    ) {
        try {
            FileType fileType = FileType.valueOf(fileTypeStr.toUpperCase());
            FileMappingConfigDTO mappingConfig = objectMapper.readValue(columnMappingJson, FileMappingConfigDTO.class);
            
            ImportResult result;
            switch (fileType) {
                case STOCK:
                    result = dataImportService.importStockData(file, mappingConfig);
                    break;
                case SALES:
                    result = dataImportService.importSalesData(file, mappingConfig);
                    break;
                case TRANSFER:
                    result = dataImportService.importTransferData(file, mappingConfig);
                    break;
                case STORE:
                    result = dataImportService.importStoreData(file, mappingConfig);
                    break;
                case PRODUCT:
                    result = dataImportService.importProductData(file, mappingConfig);
                    break;
                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("INVALID_FILE_TYPE", "Invalid file type", List.of()));
            }
            
            return ResponseEntity.ok(ApiResponse.success(result, "File uploaded and processed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("UPLOAD_ERROR", "Failed to upload file", List.of(e.getMessage())));
        }
    }
    
    /**
     * Validate stock consistency with sales and transfers
     * Validates that stock changes are logical given sales and transfers
     */
    @PostMapping("/validate-consistency")
    public ResponseEntity<ApiResponse<StockConsistencyValidationResult>> validateStockConsistency(
        @RequestParam("stockFile") MultipartFile stockFile,
        @RequestParam("salesFile") MultipartFile salesFile,
        @RequestParam("transferFile") MultipartFile transferFile,
        @RequestParam("stockMapping") String stockMappingJson,
        @RequestParam("salesMapping") String salesMappingJson,
        @RequestParam("transferMapping") String transferMappingJson
    ) {
        try {
            FileMappingConfigDTO stockMapping = objectMapper.readValue(stockMappingJson, FileMappingConfigDTO.class);
            FileMappingConfigDTO salesMapping = objectMapper.readValue(salesMappingJson, FileMappingConfigDTO.class);
            FileMappingConfigDTO transferMapping = objectMapper.readValue(transferMappingJson, FileMappingConfigDTO.class);
            
            // Parse all three files
            List<Map<String, String>> stockRows = csvProcessingService.processCsvFile(stockFile);
            List<Map<String, String>> salesRows = csvProcessingService.processCsvFile(salesFile);
            List<Map<String, String>> transferRows = csvProcessingService.processCsvFile(transferFile);
            
            // Transform rows
            Map<String, Integer> stockData = new HashMap<>();
            for (Map<String, String> stockRow : stockRows) {
                Map<String, Object> transformedRow = columnMappingService.transformRow(stockRow, stockMapping);
                Long idStore = getLongValue(transformedRow, "id_store");
                Long idProduct = getLongValue(transformedRow, "id_product");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                
                if (idStore != null && idProduct != null && quantity != null) {
                    stockData.put(idStore + "-" + idProduct, quantity);
                }
            }
            
            List<Map<String, Object>> transformedSalesRows = new ArrayList<>();
            for (Map<String, String> salesRow : salesRows) {
                transformedSalesRows.add(columnMappingService.transformRow(salesRow, salesMapping));
            }
            
            List<Map<String, Object>> transformedTransferRows = new ArrayList<>();
            for (Map<String, String> transferRow : transferRows) {
                transformedTransferRows.add(columnMappingService.transformRow(transferRow, transferMapping));
            }
            
            // Validate consistency and analyze new vs update records
            StockConsistencyValidationResult result = stockConsistencyValidationService
                .validateStockConsistencyFromParsedData(stockData, transformedSalesRows, transformedTransferRows);
            
            if (result.getValid()) {
                return ResponseEntity.ok(ApiResponse.success(result, "Stock consistency validated successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.success(result, "Stock consistency validation failed"));
            }
        } catch (Exception e) {
            StockConsistencyValidationResult errorResult = new StockConsistencyValidationResult();
            errorResult.setValid(false);
            errorResult.setErrors(List.of(e.getMessage()));
            errorResult.setMessage("Validation error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.success(errorResult, "Failed to validate consistency"));
        }
    }
    
    /**
     * Validate stock consistency and return validation result.
     * After validation passes, users should upload files separately using /upload endpoint.
     * This endpoint only validates - it does not import data.
     */
    @PostMapping("/validate-consistency-only")
    public ResponseEntity<ApiResponse<StockConsistencyValidationResult>> validateConsistencyOnly(
        @RequestParam("stockFile") MultipartFile stockFile,
        @RequestParam("salesFile") MultipartFile salesFile,
        @RequestParam("transferFile") MultipartFile transferFile,
        @RequestParam("stockMapping") String stockMappingJson,
        @RequestParam("salesMapping") String salesMappingJson,
        @RequestParam("transferMapping") String transferMappingJson
    ) {
        // This is the same as validate-consistency endpoint, kept for backward compatibility
        return validateStockConsistency(stockFile, salesFile, transferFile, 
            stockMappingJson, salesMappingJson, transferMappingJson);
    }
    
    /**
     * Check consistency of current database data
     * Validates all stock entries against recent sales and transfers
     */
    @GetMapping("/check-database-consistency")
    public ResponseEntity<ApiResponse<StockConsistencyValidationResult>> checkDatabaseConsistency(
        @RequestParam(value = "date", required = false) String dateStr
    ) {
        try {
            java.time.LocalDate checkDate;
            if (dateStr != null && !dateStr.isEmpty()) {
                try {
                    checkDate = java.time.LocalDate.parse(dateStr);
                } catch (Exception e) {
                    checkDate = java.time.LocalDate.now();
                }
            } else {
                checkDate = java.time.LocalDate.now();
            }
            
            List<String> errors = stockConsistencyValidationService.validateCurrentDatabaseConsistency(checkDate);
            
            StockConsistencyValidationResult result = new StockConsistencyValidationResult();
            result.setValid(errors.isEmpty());
            result.setErrors(errors);
            result.setMessage(errors.isEmpty() 
                ? "Database consistency check passed for date: " + checkDate
                : "Database consistency check found " + errors.size() + " issue(s) for date: " + checkDate);
            
            if (errors.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(result, "Database consistency validated successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.success(result, "Database consistency check found issues"));
            }
        } catch (Exception e) {
            StockConsistencyValidationResult errorResult = new StockConsistencyValidationResult();
            errorResult.setValid(false);
            errorResult.setErrors(List.of(e.getMessage()));
            errorResult.setMessage("Error checking database consistency: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.success(errorResult, "Failed to check database consistency"));
        }
    }
    
    private Long getLongValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong(((String) value).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
    
    private Integer getIntegerValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt(((String) value).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
    
}
