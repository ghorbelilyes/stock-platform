package com.inventory.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.orchestrator.dto.FileMappingConfigDTO;
import com.inventory.orchestrator.dto.ImportResult;
import com.inventory.orchestrator.dto.StockConsistencyValidationResult;
import com.inventory.orchestrator.entity.*;
import com.inventory.orchestrator.repository.*;
import com.inventory.orchestrator.service.StockConsistencyValidationService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final StockConsistencyValidationService stockConsistencyValidationService;
    private final AuditService auditService;
    
    @Autowired
    public DataImportService(StockRepository stockRepository,
                            SalesRepository salesRepository,
                            TransferRepository transferRepository,
                            ProductRepository productRepository,
                            StoreRepository storeRepository,
                            FileUploadRepository fileUploadRepository,
                            CsvProcessingService csvProcessingService,
                            ColumnMappingService columnMappingService,
                            ObjectMapper objectMapper,
                            StockConsistencyValidationService stockConsistencyValidationService,
                            AuditService auditService) {
        this.stockRepository = stockRepository;
        this.salesRepository = salesRepository;
        this.transferRepository = transferRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.fileUploadRepository = fileUploadRepository;
        this.csvProcessingService = csvProcessingService;
        this.columnMappingService = columnMappingService;
        this.objectMapper = objectMapper;
        this.stockConsistencyValidationService = stockConsistencyValidationService;
        this.auditService = auditService;
    }
    
    /**
     * Import stock data from CSV with optional consistency validation
     * @param salesFile Optional sales file for validation
     * @param transferFile Optional transfer file for validation
     * @param salesMappingConfig Optional mapping config for sales file
     * @param transferMappingConfig Optional mapping config for transfer file
     */
    @Transactional
    public ImportResult importStockDataWithValidation(
            MultipartFile file, 
            FileMappingConfigDTO mappingConfig,
            MultipartFile salesFile,
            MultipartFile transferFile,
            FileMappingConfigDTO salesMappingConfig,
            FileMappingConfigDTO transferMappingConfig) throws Exception {
        
        // If sales and transfer files are provided, validate consistency
        if (salesFile != null && transferFile != null && 
            salesMappingConfig != null && transferMappingConfig != null) {
            
            // Parse all three files
            List<Map<String, String>> stockRows = csvProcessingService.processCsvFile(file);
            List<Map<String, String>> salesRows = csvProcessingService.processCsvFile(salesFile);
            List<Map<String, String>> transferRows = csvProcessingService.processCsvFile(transferFile);
            
            // Transform rows
            Map<String, Integer> stockData = new HashMap<>();
            for (Map<String, String> stockRow : stockRows) {
                Map<String, Object> transformedRow = columnMappingService.transformRow(stockRow, mappingConfig);
                Long idStore = getLongValue(transformedRow, "id_store");
                Long idProduct = getLongValue(transformedRow, "id_product");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                
                if (idStore != null && idProduct != null && quantity != null) {
                    stockData.put(idStore + "-" + idProduct, quantity);
                }
            }
            
            List<Map<String, Object>> transformedSalesRows = new ArrayList<>();
            for (Map<String, String> salesRow : salesRows) {
                transformedSalesRows.add(columnMappingService.transformRow(salesRow, salesMappingConfig));
            }
            
            List<Map<String, Object>> transformedTransferRows = new ArrayList<>();
            for (Map<String, String> transferRow : transferRows) {
                transformedTransferRows.add(columnMappingService.transformRow(transferRow, transferMappingConfig));
            }
            
            // Validate consistency
            StockConsistencyValidationResult validationResult = stockConsistencyValidationService
                .validateStockConsistencyFromParsedData(stockData, transformedSalesRows, transformedTransferRows);
            
            if (!validationResult.getValid()) {
                ImportResult errorResult = new ImportResult();
                errorResult.setFileName(file.getOriginalFilename());
                errorResult.setFileType(FileType.STOCK);
                errorResult.setUploadedAt(LocalDateTime.now());
                errorResult.setValid(false);
                errorResult.setErrors(validationResult.getErrors());
                errorResult.setRowsProcessed(0);
                errorResult.setRowsInserted(0);
                errorResult.setRowsFailed(0);
                return errorResult;
            }
        }
        
        // Continue with normal import
        return importStockData(file, mappingConfig);
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
                LocalDateTime rangeDate = getDateTimeValue(transformedRow, "range_date");
                
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
     * Supports updating existing transfers (by matching date, stores, product) or creating new ones
     * When status changes from "approved" to "in_transit", reduces stock from sending store
     * When creating new transfers with status "in_transit", reduces stock from sending store
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
                
                LocalDateTime date = getDateTimeValue(transformedRow, "date");
                Long idStoreSent = getLongValue(transformedRow, "id_store_sent");
                Long idStoreReceive = getLongValue(transformedRow, "id_store_receive");
                Long idProduct = getLongValue(transformedRow, "id_product");
                String reason = getStringValue(transformedRow, "reason");
                Integer quantity = getIntegerValue(transformedRow, "quantity");
                String status = getStringValue(transformedRow, "status");
                
                // Status is optional, default to "in_transit"
                if (status == null || status.trim().isEmpty()) {
                    status = "in_transit";
                } else {
                    status = status.trim().toLowerCase();
                    // Normalize status values
                    if (status.equals("in progress") || status.equals("in_progress")) {
                        status = "in_transit";
                    }
                }
                
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
                
                // Try to find existing transfer by date, stores, and product
                Transfer existingTransfer = findExistingTransfer(date, idStoreSent, idStoreReceive, idProduct);
                Transfer transfer;
                String oldStatus = null;
                
                if (existingTransfer != null) {
                    // Update existing transfer
                    transfer = existingTransfer;
                    oldStatus = transfer.getStatus();
                    transfer.setReason(reason != null ? reason : transfer.getReason());
                    transfer.setQuantity(quantity);
                    transfer.setStatus(status);
                } else {
                    // Create new transfer
                    transfer = new Transfer();
                    transfer.setDate(date);
                    transfer.setIdStoreSent(idStoreSent);
                    transfer.setIdStoreReceive(idStoreReceive);
                    transfer.setIdProduct(idProduct);
                    transfer.setReason(reason);
                    transfer.setQuantity(quantity);
                    transfer.setStatus(status);
                }
                
                // Handle stock changes based on transfer status
                // Rules:
                // - approved: no stock change
                // - approved -> in_transit: reduce from sending store
                // - in_transit -> received: add to receiving store (sending store already reduced)
                // - approved -> received: reduce from sending store AND add to receiving store
                
                if (existingTransfer == null) {
                    // NEW transfer
                    if ("in_transit".equals(status)) {
                        // New transfer with "in_transit" status - reduce from sending store
                        reduceStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                    } else if ("received".equals(status) || "closed".equals(status)) {
                        // New transfer with "received"/"closed" status - reduce from sending store AND add to receiving store
                        reduceStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                        addStockForTransfer(idStoreReceive, idProduct, quantity, result, rowNumber);
                    }
                    // approved: no stock change
                } else {
                    // EXISTING transfer - handle status changes
                    if ("approved".equals(oldStatus) && "in_transit".equals(status)) {
                        // approved -> in_transit: reduce from sending store
                        reduceStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                    } else if ("approved".equals(oldStatus) && ("received".equals(status) || "closed".equals(status))) {
                        // approved -> received/closed: reduce from sending store AND add to receiving store
                        reduceStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                        addStockForTransfer(idStoreReceive, idProduct, quantity, result, rowNumber);
                    } else if ("in_transit".equals(oldStatus) && ("received".equals(status) || "closed".equals(status))) {
                        // in_transit -> received/closed: add to receiving store (sending store already reduced)
                        addStockForTransfer(idStoreReceive, idProduct, quantity, result, rowNumber);
                    } else if ("in_transit".equals(oldStatus) && "approved".equals(status)) {
                        // in_transit -> approved: revert the reduction from sending store
                        addStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                    } else if (("received".equals(oldStatus) || "closed".equals(oldStatus)) && "in_transit".equals(status)) {
                        // received/closed -> in_transit: remove from receiving store (sending store was already reduced)
                        reduceStockForTransfer(idStoreReceive, idProduct, quantity, result, rowNumber);
                    } else if (("received".equals(oldStatus) || "closed".equals(oldStatus)) && "approved".equals(status)) {
                        // received/closed -> approved: revert both effects
                        addStockForTransfer(idStoreSent, idProduct, quantity, result, rowNumber);
                        reduceStockForTransfer(idStoreReceive, idProduct, quantity, result, rowNumber);
                    }
                    // Other status changes (e.g., approved -> approved, received -> received): no stock change
                }
                
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
     * Find existing transfer by date, stores, and product
     */
    private Transfer findExistingTransfer(LocalDateTime date, Long idStoreSent, Long idStoreReceive, Long idProduct) {
        // Find transfers on the same day (start of day to end of day)
        LocalDateTime startOfDay = date.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = date.toLocalDate().atTime(23, 59, 59);
        List<Transfer> transfers = transferRepository.findByDateBetween(startOfDay, endOfDay);
        for (Transfer transfer : transfers) {
            if (transfer.getIdStoreSent().equals(idStoreSent) &&
                transfer.getIdStoreReceive().equals(idStoreReceive) &&
                transfer.getIdProduct().equals(idProduct)) {
                return transfer;
            }
        }
        return null;
    }
    
    /**
     * Reduce stock from sending store when transfer moves to in_transit
     */
    private void reduceStockForTransfer(Long idStoreSent, Long idProduct, Integer quantity, ImportResult result, int rowNumber) {
        try {
            Stock stock = stockRepository.findByIdStoreAndIdProduct(idStoreSent, idProduct);
            if (stock == null) {
                result.getErrors().add("Row " + rowNumber + ": No stock found for Store " + idStoreSent + ", Product " + idProduct);
                return;
            }
            
            int currentQuantity = stock.getQuantity();
            if (currentQuantity < quantity) {
                result.getErrors().add("Row " + rowNumber + ": Insufficient stock. Store " + idStoreSent + 
                    ", Product " + idProduct + " has " + currentQuantity + " but transfer requires " + quantity);
                return;
            }
            
            stock.setQuantity(currentQuantity - quantity);
            stockRepository.save(stock);
        } catch (Exception e) {
            result.getErrors().add("Row " + rowNumber + ": Error reducing stock: " + e.getMessage());
        }
    }
    
    /**
     * Add stock to receiving store when transfer status becomes received
     */
    private void addStockForTransfer(Long idStoreReceive, Long idProduct, Integer quantity, ImportResult result, int rowNumber) {
        try {
            Stock stock = stockRepository.findByIdStoreAndIdProduct(idStoreReceive, idProduct);
            if (stock == null) {
                // Create new stock entry if it doesn't exist
                stock = new Stock();
                stock.setIdStore(idStoreReceive);
                stock.setIdProduct(idProduct);
                stock.setQuantity(quantity);
            } else {
                // Add to existing stock
                stock.setQuantity(stock.getQuantity() + quantity);
            }
            stockRepository.save(stock);
        } catch (Exception e) {
            result.getErrors().add("Row " + rowNumber + ": Error adding stock: " + e.getMessage());
        }
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
        FileUpload saved = fileUploadRepository.save(fileUpload);
        
        // Audit log the file upload/import
        String action = "FILE_UPLOAD_" + saved.getFileType().name();
        auditService.logAudit(
            action,
            "FileUpload",
            saved.getId(),
            null, // No old value for new upload
            saved // New value (file upload record)
        );
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
        if (value instanceof LocalDateTime) return ((LocalDateTime) value).toLocalDate();
        if (value instanceof String) {
            try {
                return LocalDate.parse((String) value);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
    
    private LocalDateTime getDateTimeValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        if (value instanceof LocalDateTime) return (LocalDateTime) value;
        if (value instanceof LocalDate) return ((LocalDate) value).atStartOfDay();
        if (value instanceof String) {
            try {
                // Try parsing as ISO datetime first
                return LocalDateTime.parse((String) value);
            } catch (Exception e) {
                try {
                    // Try parsing as date and convert to start of day
                    return LocalDate.parse((String) value).atStartOfDay();
                } catch (Exception ex) {
                    return null;
                }
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
