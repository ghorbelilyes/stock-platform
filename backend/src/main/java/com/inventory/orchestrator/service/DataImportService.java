package com.inventory.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.orchestrator.dto.FileMappingConfigDTO;
import com.inventory.orchestrator.dto.ImportResult;
import com.inventory.orchestrator.entity.*;
import com.inventory.orchestrator.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DataImportService {
    
    private final StockRepository stockRepository;
    private final SalesRepository salesRepository;
    private final TransferRepository transferRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final FileUploadRepository fileUploadRepository;
    private final CsvProcessingService csvProcessingService;
    private final ColumnMappingService columnMappingService;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public DataImportService(StockRepository stockRepository,
                            SalesRepository salesRepository,
                            TransferRepository transferRepository,
                            ProductRepository productRepository,
                            StoreRepository storeRepository,
                            FileUploadRepository fileUploadRepository,
                            CsvProcessingService csvProcessingService,
                            ColumnMappingService columnMappingService,
                            ObjectMapper objectMapper) {
        this.stockRepository = stockRepository;
        this.salesRepository = salesRepository;
        this.transferRepository = transferRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.fileUploadRepository = fileUploadRepository;
        this.csvProcessingService = csvProcessingService;
        this.columnMappingService = columnMappingService;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Import stock data from CSV
     */
    @Transactional
    public ImportResult importStockData(MultipartFile file, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = createFileUploadRecord(file, FileType.STOCK, mappingConfig);
        
        ImportResult result = new ImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setFileType(FileType.STOCK);
        result.setUploadedAt(LocalDateTime.now());
        result.setErrors(new ArrayList<>());
        result.setRowsProcessed(0);
        result.setRowsInserted(0);
        result.setRowsFailed(0);
        
        List<Map<String, String>> csvRows = csvProcessingService.processCsvFile(file);
        result.setRowsProcessed(csvRows.size());
        
        List<Stock> stocksToSave = new ArrayList<>();
        int rowNumber = 1;
        
        for (Map<String, String> csvRow : csvRows) {
            rowNumber++;
            try {
                Map<String, Object> transformedRow = columnMappingService.transformRow(csvRow, mappingConfig);
                
                Long idStore = getLongValue(transformedRow, "id_store");
                Long idProduct = getLongValue(transformedRow, "id_product");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                
                if (idStore == null || idProduct == null || quantity == null) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required fields");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (quantity < 0) {
                    result.getErrors().add("Row " + rowNumber + ": Quantity cannot be negative");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if product exists
                if (!productRepository.existsById(idProduct)) {
                    result.getErrors().add("Row " + rowNumber + ": Product ID " + idProduct + " does not exist");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                Stock stock = new Stock();
                stock.setIdStore(idStore);
                stock.setIdProduct(idProduct);
                stock.setQuantity(quantity);
                
                stocksToSave.add(stock);
                
            } catch (Exception e) {
                result.getErrors().add("Row " + rowNumber + ": " + e.getMessage());
                result.setRowsFailed(result.getRowsFailed() + 1);
            }
        }
        
        // Batch save
        if (!stocksToSave.isEmpty()) {
            stockRepository.saveAll(stocksToSave);
            result.setRowsInserted(stocksToSave.size());
        }
        
        result.setValid(result.getRowsFailed() == 0);
        updateFileUploadRecord(fileUpload, result);
        
        result.setFileUploadId(fileUpload.getId());
        return result;
    }
    
    /**
     * Import sales data from CSV
     */
    @Transactional
    public ImportResult importSalesData(MultipartFile file, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = createFileUploadRecord(file, FileType.SALES, mappingConfig);
        
        ImportResult result = new ImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setFileType(FileType.SALES);
        result.setUploadedAt(LocalDateTime.now());
        result.setErrors(new ArrayList<>());
        result.setRowsProcessed(0);
        result.setRowsInserted(0);
        result.setRowsFailed(0);
        
        List<Map<String, String>> csvRows = csvProcessingService.processCsvFile(file);
        result.setRowsProcessed(csvRows.size());
        
        List<Sales> salesToSave = new ArrayList<>();
        int rowNumber = 1;
        
        for (Map<String, String> csvRow : csvRows) {
            rowNumber++;
            try {
                Map<String, Object> transformedRow = columnMappingService.transformRow(csvRow, mappingConfig);
                
                Long idStore = getLongValue(transformedRow, "id_store");
                Long idProduct = getLongValue(transformedRow, "id_product");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                LocalDate rangeDate = getDateValue(transformedRow, "range_date");
                
                if (idStore == null || idProduct == null || quantity == null || rangeDate == null) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required fields");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (quantity <= 0) {
                    result.getErrors().add("Row " + rowNumber + ": Quantity must be greater than 0");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if store and product exist
                if (!storeRepository.existsById(idStore)) {
                    result.getErrors().add("Row " + rowNumber + ": Store ID " + idStore + " does not exist");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if product exists
                if (!productRepository.existsById(idProduct)) {
                    result.getErrors().add("Row " + rowNumber + ": Product ID " + idProduct + " does not exist");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                Sales sales = new Sales();
                sales.setIdStore(idStore);
                sales.setIdProduct(idProduct);
                sales.setQuantity(quantity);
                sales.setRangeDate(rangeDate);
                
                salesToSave.add(sales);
                
            } catch (Exception e) {
                result.getErrors().add("Row " + rowNumber + ": " + e.getMessage());
                result.setRowsFailed(result.getRowsFailed() + 1);
            }
        }
        
        // Batch save
        if (!salesToSave.isEmpty()) {
            salesRepository.saveAll(salesToSave);
            result.setRowsInserted(salesToSave.size());
        }
        
        result.setValid(result.getRowsFailed() == 0);
        updateFileUploadRecord(fileUpload, result);
        
        result.setFileUploadId(fileUpload.getId());
        return result;
    }
    
    /**
     * Import transfer data from CSV
     */
    @Transactional
    public ImportResult importTransferData(MultipartFile file, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = createFileUploadRecord(file, FileType.TRANSFER, mappingConfig);
        
        ImportResult result = new ImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setFileType(FileType.TRANSFER);
        result.setUploadedAt(LocalDateTime.now());
        result.setErrors(new ArrayList<>());
        result.setRowsProcessed(0);
        result.setRowsInserted(0);
        result.setRowsFailed(0);
        
        List<Map<String, String>> csvRows = csvProcessingService.processCsvFile(file);
        result.setRowsProcessed(csvRows.size());
        
        List<Transfer> transfersToSave = new ArrayList<>();
        int rowNumber = 1;
        
        for (Map<String, String> csvRow : csvRows) {
            rowNumber++;
            try {
                Map<String, Object> transformedRow = columnMappingService.transformRow(csvRow, mappingConfig);
                
                LocalDate date = getDateValue(transformedRow, "date");
                Long idStoreSent = getLongValue(transformedRow, "id_store_sent");
                Long idStoreReceive = getLongValue(transformedRow, "id_store_receive");
                Long idProduct = getLongValue(transformedRow, "id_product");
                String reason = getStringValue(transformedRow, "reason");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                
                if (date == null || idStoreSent == null || idStoreReceive == null || 
                    idProduct == null || quantity == null) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required fields");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (quantity <= 0) {
                    result.getErrors().add("Row " + rowNumber + ": Quantity must be greater than 0");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (idStoreSent.equals(idStoreReceive)) {
                    result.getErrors().add("Row " + rowNumber + ": Store sent and store receive cannot be the same");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if product exists
                if (!productRepository.existsById(idProduct)) {
                    result.getErrors().add("Row " + rowNumber + ": Product ID " + idProduct + " does not exist");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                Transfer transfer = new Transfer();
                transfer.setDate(date);
                transfer.setIdStoreSent(idStoreSent);
                transfer.setIdStoreReceive(idStoreReceive);
                transfer.setIdProduct(idProduct);
                transfer.setReason(reason);
                transfer.setQuantity(quantity);
                
                transfersToSave.add(transfer);
                
            } catch (Exception e) {
                result.getErrors().add("Row " + rowNumber + ": " + e.getMessage());
                result.setRowsFailed(result.getRowsFailed() + 1);
            }
        }
        
        // Batch save
        if (!transfersToSave.isEmpty()) {
            transferRepository.saveAll(transfersToSave);
            result.setRowsInserted(transfersToSave.size());
        }
        
        result.setValid(result.getRowsFailed() == 0);
        updateFileUploadRecord(fileUpload, result);
        
        result.setFileUploadId(fileUpload.getId());
        return result;
    }
    
    /**
     * Import store data from CSV
     */
    @Transactional
    public ImportResult importStoreData(MultipartFile file, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = createFileUploadRecord(file, FileType.STORE, mappingConfig);
        
        ImportResult result = new ImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setFileType(FileType.STORE);
        result.setUploadedAt(LocalDateTime.now());
        result.setErrors(new ArrayList<>());
        result.setRowsProcessed(0);
        result.setRowsInserted(0);
        result.setRowsFailed(0);
        
        List<Map<String, String>> csvRows = csvProcessingService.processCsvFile(file);
        result.setRowsProcessed(csvRows.size());
        
        List<Store> storesToSave = new ArrayList<>();
        int rowNumber = 1;
        
        for (Map<String, String> csvRow : csvRows) {
            rowNumber++;
            try {
                Map<String, Object> transformedRow = columnMappingService.transformRow(csvRow, mappingConfig);
                
                Long id = getLongValue(transformedRow, "id");
                String serialNumber = getStringValue(transformedRow, "serial_number");
                String name = getStringValue(transformedRow, "name");
                String city = getStringValue(transformedRow, "city");
                String type = getStringValue(transformedRow, "type");
                
                // Validate serial number (required and unique)
                if (serialNumber == null || serialNumber.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'serial_number'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                serialNumber = serialNumber.trim();
                
                // ID is REQUIRED for data import (not auto-derived)
                if (id == null) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'id'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if store with this ID already exists
                java.util.Optional<Store> existingStoreOpt = storeRepository.findById(id);
                Store store;
                
                if (existingStoreOpt.isPresent()) {
                    // Update existing store
                    store = existingStoreOpt.get();
                } else {
                    // Create new store with provided ID
                    store = new Store();
                    store.setId(id);
                    store.setSerialNumber(serialNumber);
                }
                
                if (name == null || name.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'name'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (city == null || city.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'city'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                if (type == null || type.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'type'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Validate type value
                if (!type.equalsIgnoreCase("store") && !type.equalsIgnoreCase("warehouse")) {
                    result.getErrors().add("Row " + rowNumber + ": Type must be 'store' or 'warehouse', got: " + type);
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Optional: leadTimeDays
                Integer leadTimeDays = null;
                if (transformedRow.containsKey("leadTimeDays") && transformedRow.get("leadTimeDays") != null) {
                    leadTimeDays = getIntegerValue(transformedRow, "leadTimeDays");
                }
                
                // Update store fields
                store.setName(name.trim());
                store.setCity(city.trim());
                store.setType(type.toLowerCase());
                if (leadTimeDays != null) {
                    store.setLeadTimeDays(leadTimeDays);
                }
                
                storesToSave.add(store);
                
            } catch (Exception e) {
                result.getErrors().add("Row " + rowNumber + ": " + e.getMessage());
                result.setRowsFailed(result.getRowsFailed() + 1);
            }
        }
        
        // Batch save
        if (!storesToSave.isEmpty()) {
            storeRepository.saveAll(storesToSave);
            result.setRowsInserted(storesToSave.size());
        }
        
        result.setValid(result.getRowsFailed() == 0);
        updateFileUploadRecord(fileUpload, result);
        
        result.setFileUploadId(fileUpload.getId());
        return result;
    }
    
    /**
     * Import product data from CSV
     */
    @Transactional
    public ImportResult importProductData(MultipartFile file, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = createFileUploadRecord(file, FileType.PRODUCT, mappingConfig);
        
        ImportResult result = new ImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setFileType(FileType.PRODUCT);
        result.setUploadedAt(LocalDateTime.now());
        result.setErrors(new ArrayList<>());
        result.setRowsProcessed(0);
        result.setRowsInserted(0);
        result.setRowsFailed(0);
        
        List<Map<String, String>> csvRows = csvProcessingService.processCsvFile(file);
        result.setRowsProcessed(csvRows.size());
        
        List<Product> productsToSave = new ArrayList<>();
        int rowNumber = 1;
        
        for (Map<String, String> csvRow : csvRows) {
            rowNumber++;
            try {
                Map<String, Object> transformedRow = columnMappingService.transformRow(csvRow, mappingConfig);
                
                Long id = getLongValue(transformedRow, "id");
                String codeBarre = getStringValue(transformedRow, "code_barre");
                String name = getStringValue(transformedRow, "name");
                String description = getStringValue(transformedRow, "description");
                
                // Validate code_barre (required and unique)
                if (codeBarre == null || codeBarre.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'code_barre'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                codeBarre = codeBarre.trim();
                
                // ID is REQUIRED for data import (not auto-derived)
                if (id == null) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'id'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Check if product with this ID already exists
                java.util.Optional<Product> existingProductOpt = productRepository.findById(id);
                Product product;
                
                if (existingProductOpt.isPresent()) {
                    // Update existing product
                    product = existingProductOpt.get();
                } else {
                    // Create new product with provided ID
                    product = new Product();
                    product.setId(id);
                    product.setCodeBarre(codeBarre);
                }
                
                if (name == null || name.trim().isEmpty()) {
                    result.getErrors().add("Row " + rowNumber + ": Missing required field 'name'");
                    result.setRowsFailed(result.getRowsFailed() + 1);
                    continue;
                }
                
                // Update product fields
                product.setName(name.trim());
                if (description != null && !description.trim().isEmpty()) {
                    product.setDescription(description.trim());
                }
                
                productsToSave.add(product);
                
            } catch (Exception e) {
                result.getErrors().add("Row " + rowNumber + ": " + e.getMessage());
                result.setRowsFailed(result.getRowsFailed() + 1);
            }
        }
        
        // Batch save
        if (!productsToSave.isEmpty()) {
            productRepository.saveAll(productsToSave);
            result.setRowsInserted(productsToSave.size());
        }
        
        result.setValid(result.getRowsFailed() == 0);
        updateFileUploadRecord(fileUpload, result);
        
        result.setFileUploadId(fileUpload.getId());
        return result;
    }
    
    private FileUpload createFileUploadRecord(MultipartFile file, FileType fileType, FileMappingConfigDTO mappingConfig) throws Exception {
        FileUpload fileUpload = new FileUpload();
        fileUpload.setFileName(file.getOriginalFilename());
        fileUpload.setFileType(fileType);
        fileUpload.setUploadedAt(LocalDateTime.now());
        fileUpload.setValid(false);
        fileUpload.setErrors(new ArrayList<>());
        
        // Store mapping as JSON
        String mappingJson = objectMapper.writeValueAsString(mappingConfig);
        fileUpload.setColumnMappingJson(mappingJson);
        
        return fileUploadRepository.save(fileUpload);
    }
    
    private void updateFileUploadRecord(FileUpload fileUpload, ImportResult result) {
        fileUpload.setValid(result.getValid());
        fileUpload.setErrors(result.getErrors());
        fileUpload.setRowsProcessed(result.getRowsProcessed());
        fileUpload.setRowsInserted(result.getRowsInserted());
        fileUpload.setRowsFailed(result.getRowsFailed());
        fileUploadRepository.save(fileUpload);
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
    
    private LocalDate getDateValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        if (value instanceof LocalDate) return (LocalDate) value;
        if (value instanceof String) {
            try {
                return LocalDate.parse((String) value);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
    
    private String getStringValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        return value.toString();
    }
}
