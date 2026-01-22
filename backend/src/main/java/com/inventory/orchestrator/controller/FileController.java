package com.inventory.orchestrator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.orchestrator.dto.*;
import com.inventory.orchestrator.entity.FileType;
import com.inventory.orchestrator.service.ColumnMappingService;
import com.inventory.orchestrator.service.CsvProcessingService;
import com.inventory.orchestrator.service.DataImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class FileController {
    
    private final CsvProcessingService csvProcessingService;
    private final ColumnMappingService columnMappingService;
    private final DataImportService dataImportService;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public FileController(CsvProcessingService csvProcessingService, 
                         ColumnMappingService columnMappingService,
                         DataImportService dataImportService,
                         ObjectMapper objectMapper) {
        this.csvProcessingService = csvProcessingService;
        this.columnMappingService = columnMappingService;
        this.dataImportService = dataImportService;
        this.objectMapper = objectMapper;
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
    
}
