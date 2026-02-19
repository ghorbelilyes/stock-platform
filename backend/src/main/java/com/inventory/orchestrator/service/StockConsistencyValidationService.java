package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.StockConsistencyValidationResult;
import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.entity.Sales;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.repository.StockRepository;
import com.inventory.orchestrator.repository.SalesRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service to validate stock consistency against sales and transfers.
 * 
 * Validates that: Stock(today) = Stock(yesterday) + Transfers(received today) -
 * Transfers(sent today) - Sales(today)
 */
@Service
public class StockConsistencyValidationService {

    private static final Logger logger = LoggerFactory.getLogger(StockConsistencyValidationService.class);

    private final StockRepository stockRepository;
    private final SalesRepository salesRepository;
    private final TransferRepository transferRepository;

    public StockConsistencyValidationService(
            StockRepository stockRepository,
            SalesRepository salesRepository,
            TransferRepository transferRepository) {
        this.stockRepository = stockRepository;
        this.salesRepository = salesRepository;
        this.transferRepository = transferRepository;
    }

    /**
     * Validates stock consistency for a given date.
     * 
     * @param stockData      Map of (storeId, productId) -> quantity from uploaded
     *                       stock file
     * @param salesData      List of sales from uploaded sales file (should be for
     *                       the same date)
     * @param transferData   List of transfers from uploaded transfer file (should
     *                       be for the same date)
     * @param validationDate The date for which we're validating (typically today)
     * @return List of validation errors (empty if valid)
     */
    public List<String> validateStockConsistency(
            Map<String, Integer> stockData,
            List<Sales> salesData,
            List<Transfer> transferData,
            LocalDate validationDate) {

        List<String> errors = new ArrayList<>();

        logger.info(
                "validateStockConsistency called: validationDate={}, transferData size={}, salesData size={}, stockData size={}",
                validationDate, transferData != null ? transferData.size() : 0,
                salesData != null ? salesData.size() : 0, stockData != null ? stockData.size() : 0);

        // Compute the earliest date across all CSV data for DB lookups
        // This replaces the fixed 30-day window to handle records from any time period
        LocalDate earliestCsvDate = validationDate;
        if (salesData != null) {
            for (Sales sale : salesData) {
                if (sale.getRangeDate() != null) {
                    LocalDate d = sale.getRangeDate().toLocalDate();
                    if (d.isBefore(earliestCsvDate))
                        earliestCsvDate = d;
                }
            }
        }
        if (transferData != null) {
            for (Transfer transfer : transferData) {
                if (transfer.getDate() != null) {
                    LocalDate d = transfer.getDate().toLocalDate();
                    if (d.isBefore(earliestCsvDate))
                        earliestCsvDate = d;
                }
            }
        }
        logger.info("Earliest CSV date: {}, Validation date: {}", earliestCsvDate, validationDate);

        // Get existing sales from DB to identify NEW sales only
        Map<String, Sales> existingSalesMap = new HashMap<>();
        if (salesData != null && !salesData.isEmpty()) {
            LocalDateTime startOfRange = earliestCsvDate.atStartOfDay();
            LocalDateTime endOfRange = validationDate.atTime(23, 59, 59);
            List<Sales> existingSales = salesRepository.findByRangeDateBetween(startOfRange, endOfRange);
            for (Sales existing : existingSales) {
                // Use a standardized key for matching
                String key = getEventKey(existing.getIdStore() + "-" + existing.getIdProduct(),
                        existing.getRangeDate());
                existingSalesMap.put(key, existing);
            }
            logger.info("Found {} existing sales in DB for date range {} to {}", existingSales.size(), startOfRange,
                    endOfRange);
        }

        // Group NEW sales by (storeId, productId) and sum quantities
        // Only count sales that are NOT already in DB (new records)
        Map<String, Integer> newSalesByStoreProduct = new HashMap<>();
        if (salesData != null) {
            for (Sales sale : salesData) {
                if (sale.getRangeDate() != null) {
                    String key = getEventKey(sale.getIdStore() + "-" + sale.getIdProduct(), sale.getRangeDate());
                    // Only count if this is a NEW sale (not in DB)
                    if (!existingSalesMap.containsKey(key)) {
                        String storeProductKey = sale.getIdStore() + "-" + sale.getIdProduct();
                        newSalesByStoreProduct.put(storeProductKey,
                                newSalesByStoreProduct.getOrDefault(storeProductKey, 0) + sale.getQuantity());
                        logger.debug("New sale: Store {}, Product {}, Qty {}, Date {}",
                                sale.getIdStore(), sale.getIdProduct(), sale.getQuantity(), sale.getRangeDate());
                    } else {
                        logger.debug("Skipping duplicate sale: Store {}, Product {}, Date {}",
                                sale.getIdStore(), sale.getIdProduct(), sale.getRangeDate());
                    }
                }
            }
        }
        logger.info("New sales count: {}", newSalesByStoreProduct);

        // Get existing transfers from DB to check for status changes
        Map<String, Transfer> existingTransfersMap = new HashMap<>();
        if (transferData != null && !transferData.isEmpty()) {
            LocalDateTime startOfRange = earliestCsvDate.atStartOfDay();
            LocalDateTime endOfRange = validationDate.atTime(23, 59, 59);
            List<Transfer> existingTransfers = transferRepository.findByDateBetween(startOfRange, endOfRange);
            for (Transfer existing : existingTransfers) {
                // Use standardized key for exact matching
                String key = getEventKey(existing.getIdStoreSent() + "-" + existing.getIdStoreReceive() +
                        "-" + existing.getIdProduct(), existing.getDate());
                existingTransfersMap.put(key, existing);
            }
            logger.info("Found {} existing transfers in DB for date range {} to {}", existingTransfers.size(),
                    startOfRange, endOfRange);
        }

        // Map CSV transfers for later status-change checks
        Map<String, Transfer> csvTransfersMap = new HashMap<>();
        if (transferData != null) {
            for (Transfer csvT : transferData) {
                if (csvT.getDate() != null) {
                    csvTransfersMap.put(getEventKey(csvT.getIdStoreSent() + "-" + csvT.getIdStoreReceive() +
                            "-" + csvT.getIdProduct(), csvT.getDate()), csvT);
                }
            }
        }

        // Calculate net transfer effects from NEW transfers and STATUS CHANGES only
        Map<String, Integer> netTransfersReceivedByStoreProduct = new HashMap<>();
        Map<String, Integer> netTransfersSentByStoreProduct = new HashMap<>();

        if (transferData != null && !transferData.isEmpty()) {
            for (Transfer transfer : transferData) {
                if (transfer.getDate() == null)
                    continue;

                String newStatus = normalizeStatus(transfer.getStatus());

                // Check if this transfer exists in DB (exact datetime match)
                String key = getEventKey(transfer.getIdStoreSent() + "-" + transfer.getIdStoreReceive() +
                        "-" + transfer.getIdProduct(), transfer.getDate());
                Transfer existingTransfer = existingTransfersMap.get(key);
                String oldStatus = normalizeStatus(existingTransfer != null ? existingTransfer.getStatus() : null);

                boolean isNewTransfer = (existingTransfer == null);
                boolean isStatusChange = (existingTransfer != null && !newStatus.equals(oldStatus));
                boolean isQuantityChange = (existingTransfer != null
                        && !transfer.getQuantity().equals(existingTransfer.getQuantity()));

                logger.debug(
                        "Transfer {}->{}, Product {}, Date {}: isNew={}, isStatusChange={}, isQuantityChange={}, oldStatus={}, newStatus={}",
                        transfer.getIdStoreSent(), transfer.getIdStoreReceive(), transfer.getIdProduct(),
                        transfer.getDate(),
                        isNewTransfer, isStatusChange, isQuantityChange, (oldStatus != null ? oldStatus : "null"),
                        newStatus);

                // Only process if it's NEW or STATUS/QUANTITY CHANGED
                if (isNewTransfer || isStatusChange || isQuantityChange) {
                    if (isNewTransfer) {
                        // NEW transfer - count based on new status
                        if ("received".equals(newStatus) || "closed".equals(newStatus)) {
                            String receiveKey = transfer.getIdStoreReceive() + "-" + transfer.getIdProduct();
                            netTransfersReceivedByStoreProduct.put(receiveKey,
                                    netTransfersReceivedByStoreProduct.getOrDefault(receiveKey, 0)
                                            + transfer.getQuantity());

                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) + transfer.getQuantity());
                        } else if ("in_transit".equals(newStatus)) {
                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) + transfer.getQuantity());
                        }
                    } else {
                        // STATUS or QUANTITY CHANGED - calculate net effect by subtracting old effect
                        // and adding new one
                        int oldQty = existingTransfer.getQuantity();
                        int newQty = transfer.getQuantity();

                        // 1. Remove old effect
                        if ("received".equals(oldStatus) || "closed".equals(oldStatus)) {
                            String receiveKey = transfer.getIdStoreReceive() + "-" + transfer.getIdProduct();
                            netTransfersReceivedByStoreProduct.put(receiveKey,
                                    netTransfersReceivedByStoreProduct.getOrDefault(receiveKey, 0) - oldQty);

                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) - oldQty);
                        } else if ("in_transit".equals(oldStatus)) {
                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) - oldQty);
                        }

                        // 2. Add new effect
                        if ("received".equals(newStatus) || "closed".equals(newStatus)) {
                            String receiveKey = transfer.getIdStoreReceive() + "-" + transfer.getIdProduct();
                            netTransfersReceivedByStoreProduct.put(receiveKey,
                                    netTransfersReceivedByStoreProduct.getOrDefault(receiveKey, 0) + newQty);

                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) + newQty);
                        } else if ("in_transit".equals(newStatus)) {
                            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
                            netTransfersSentByStoreProduct.put(sentKey,
                                    netTransfersSentByStoreProduct.getOrDefault(sentKey, 0) + newQty);
                        }
                    }
                } else {
                    logger.debug("Skipping unchanged transfer: {}->{}, Product {}, Date {}",
                            transfer.getIdStoreSent(), transfer.getIdStoreReceive(), transfer.getIdProduct(),
                            transfer.getDate());
                }
            }
        }

        logger.info("Net transfers received: {}", netTransfersReceivedByStoreProduct);
        logger.info("Net transfers sent: {}", netTransfersSentByStoreProduct);

        // Get existing in_transit transfers from DB to account for stock already
        // reduced
        // These transfers already reduced stock, so we need to account for them in our
        // calculation
        Map<String, Integer> existingInTransitSentByStoreProduct = new HashMap<>();
        if (!transferData.isEmpty()) {
            LocalDateTime startOfRange = earliestCsvDate.atStartOfDay();
            LocalDateTime endOfRange = validationDate.atTime(23, 59, 59);
            List<Transfer> allExistingTransfers = transferRepository.findByDateBetween(startOfRange, endOfRange);

            for (Transfer existing : allExistingTransfers) {
                // Only count in_transit transfers that are NOT being changed in this upload
                String key = getEventKey(existing.getIdStoreSent() + "-" + existing.getIdStoreReceive() +
                        "-" + existing.getIdProduct(), existing.getDate());

                boolean isBeingChanged = false;
                if (csvTransfersMap.containsKey(key)) {
                    Transfer uploadTransfer = csvTransfersMap.get(key);
                    String uploadStatus = normalizeStatus(uploadTransfer.getStatus());
                    String existingStatus = normalizeStatus(existing.getStatus());
                    isBeingChanged = !existingStatus.equals(uploadStatus);
                }

                if ("in_transit".equals(normalizeStatus(existing.getStatus())) && !isBeingChanged) {
                    // This in_transit transfer already reduced stock, so DB stock already reflects
                    // this
                    String sentKey = existing.getIdStoreSent() + "-" + existing.getIdProduct();
                    existingInTransitSentByStoreProduct.put(sentKey,
                            existingInTransitSentByStoreProduct.getOrDefault(sentKey, 0) + existing.getQuantity());
                }
            }
        }
        logger.info("Existing in_transit transfers (already reflected in DB stock): {}",
                existingInTransitSentByStoreProduct);

        // Validate each affected stock entry
        // We must check every store-product combination that appears in ANY of the
        // files
        Set<String> allAffectedKeys = new HashSet<>(stockData.keySet());
        allAffectedKeys.addAll(newSalesByStoreProduct.keySet());
        allAffectedKeys.addAll(netTransfersReceivedByStoreProduct.keySet());
        allAffectedKeys.addAll(netTransfersSentByStoreProduct.keySet());
        allAffectedKeys.addAll(existingInTransitSentByStoreProduct.keySet());

        logger.info("Validating {} unique store-product combinations", allAffectedKeys.size());

        for (String key : allAffectedKeys) {
            String[] parts = key.split("-");
            if (parts.length != 2) {
                errors.add("Invalid stock key format: " + key);
                continue;
            }

            Long storeId = Long.parseLong(parts[0]);
            Long productId = Long.parseLong(parts[1]);

            // Get previous stock from DB
            Stock previousStock = stockRepository.findByIdStoreAndIdProduct(storeId, productId);
            Integer dbStockQuantity = (previousStock != null) ? previousStock.getQuantity() : 0;

            // Get "new" stock quantity. If not in the uploaded file, it remains as DB
            // quantity
            Integer newStockQuantity = stockData.get(key);
            boolean missingInFile = (newStockQuantity == null);
            if (missingInFile) {
                newStockQuantity = dbStockQuantity;
            }

            // Get NEW sales for this store-product (only new, not duplicates)
            Integer newSalesQuantity = newSalesByStoreProduct.getOrDefault(storeId + "-" + productId, 0);

            // Get NET transfer effects (only from new/status-changed transfers)
            Integer netTransfersReceived = netTransfersReceivedByStoreProduct.getOrDefault(storeId + "-" + productId,
                    0);
            Integer netTransfersSent = netTransfersSentByStoreProduct.getOrDefault(storeId + "-" + productId, 0);

            // Check if there are existing in_transit transfers that already reduced stock
            // If DB stock doesn't reflect these reductions, we need to account for them
            Integer existingInTransitSent = existingInTransitSentByStoreProduct.getOrDefault(storeId + "-" + productId,
                    0);

            // Calculate expected stock
            // Stock(new) = Stock(DB) + Net Transfers(received) - Net Transfers(sent) - New
            // Sales
            Integer expectedStock = dbStockQuantity + netTransfersReceived - netTransfersSent - newSalesQuantity;

            // Special case: If existingInTransitSent > 0 and expectedStock >
            // newStockQuantity,
            // and the difference equals existingInTransitSent, it means DB stock wasn't
            // reduced.
            // The CSV is correct (or DB is correct but missing from CSV), so we adjust
            // expectedStock.
            if (existingInTransitSent > 0 && expectedStock > newStockQuantity &&
                    (expectedStock - newStockQuantity) == existingInTransitSent) {
                expectedStock = newStockQuantity;
                logger.debug(
                        "Adjusting expected stock for Store {}, Product {}: DB stock wasn't reduced for in_transit transfer.",
                        storeId, productId);
            }

            logger.debug(
                    "Store {}, Product {}: DB={}, netReceived={}, netSent={}, newSales={}, existingInTransitSent={}, expected={}, CSV={}{}",
                    storeId, productId, dbStockQuantity, netTransfersReceived, netTransfersSent, newSalesQuantity,
                    existingInTransitSent, expectedStock,
                    missingInFile ? "N/A (using DB: " : "",
                    newStockQuantity + (missingInFile ? ")" : ""));

            // Validate
            if (!newStockQuantity.equals(expectedStock)) {
                if (missingInFile) {
                    errors.add(String.format(
                            "Stock inconsistency for Store %d, Product %d: This product is missing from the Stock file, "
                                    +
                                    "but has pending transactions. Current DB stock: %d. Expected stock after transactions: %d "
                                    +
                                    "(%d + received: %d - sent: %d - sales: %d). Please include this product in your stock file with the correct quantity.",
                            storeId, productId, dbStockQuantity, expectedStock, dbStockQuantity, netTransfersReceived,
                            netTransfersSent, newSalesQuantity));
                } else {
                    errors.add(String.format(
                            "Stock inconsistency for Store %d, Product %d: Expected %d (previous: %d + received: %d - sent: %d - new sales: %d), but got %d",
                            storeId, productId, expectedStock, dbStockQuantity, netTransfersReceived, netTransfersSent,
                            newSalesQuantity, newStockQuantity));
                }
            }
        }

        return errors;
    }

    /**
     * Validates stock consistency using parsed data from CSV files.
     * This method extracts the date from sales/transfers and validates against
     * stock.
     * Also identifies which records are new vs updates based on timestamps.
     * 
     * @param stockData    Map of (storeId, productId) -> quantity
     * @param salesRows    List of parsed sales rows (Map with id_store, id_product,
     *                     quantity, range_date)
     * @param transferRows List of parsed transfer rows (Map with date,
     *                     id_store_sent, id_store_receive, id_product, quantity)
     * @return StockConsistencyValidationResult with validation errors and
     *         new/update analysis
     */
    public StockConsistencyValidationResult validateStockConsistencyFromParsedData(
            Map<String, Integer> stockData,
            List<Map<String, Object>> salesRows,
            List<Map<String, Object>> transferRows) {

        StockConsistencyValidationResult result = new StockConsistencyValidationResult();

        // CRITICAL DEBUG: Log what we received
        logger.info("=== VALIDATION START ===");
        logger.info("Received transferRows size={}, salesRows size={}, stockData size={}",
                transferRows != null ? transferRows.size() : 0,
                salesRows != null ? salesRows.size() : 0,
                stockData != null ? stockData.size() : 0);

        // Extract dates from sales and transfers to determine validation date
        // Use the LATEST date from all sales and transfers to validate against current
        // stock
        LocalDate validationDate = null;
        LocalDate latestDate = null;

        // Get all dates from sales
        for (Map<String, Object> salesRow : salesRows) {
            LocalDate date = null;
            Object dateObj = salesRow.get("range_date");
            if (dateObj instanceof LocalDateTime) {
                date = ((LocalDateTime) dateObj).toLocalDate();
            } else if (dateObj instanceof LocalDate) {
                date = (LocalDate) dateObj;
            } else if (dateObj instanceof String) {
                String dateStr = ((String) dateObj).trim();
                try {
                    // Try parsing as ISO datetime first (with T separator)
                    date = LocalDateTime.parse(dateStr).toLocalDate();
                } catch (Exception e) {
                    try {
                        // Try parsing with space separator (e.g., "2025-01-14 10:00:00")
                        date = LocalDateTime
                                .parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                .toLocalDate();
                    } catch (Exception ex) {
                        try {
                            // Try parsing as date only
                            date = LocalDate.parse(dateStr);
                        } catch (Exception exc) {
                            logger.warn("Failed to parse sales date string: {}", dateStr);
                            // Continue
                        }
                    }
                }
            }
            if (date != null && (latestDate == null || date.isAfter(latestDate))) {
                latestDate = date;
            }
        }

        // Get all dates from transfers
        for (Map<String, Object> transferRow : transferRows) {
            LocalDate date = null;
            Object dateObj = transferRow.get("date");
            if (dateObj instanceof LocalDateTime) {
                date = ((LocalDateTime) dateObj).toLocalDate();
            } else if (dateObj instanceof LocalDate) {
                date = (LocalDate) dateObj;
            } else if (dateObj instanceof String) {
                String dateStr = ((String) dateObj).trim();
                try {
                    // Try parsing as ISO datetime first (with T separator)
                    date = LocalDateTime.parse(dateStr).toLocalDate();
                } catch (Exception e) {
                    try {
                        // Try parsing with space separator (e.g., "2025-01-13 09:00:00")
                        date = LocalDateTime
                                .parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                .toLocalDate();
                    } catch (Exception ex) {
                        try {
                            // Try parsing as date only
                            date = LocalDate.parse(dateStr);
                        } catch (Exception exc) {
                            logger.warn("Failed to parse transfer date string: {}", dateStr);
                            // Continue
                        }
                    }
                }
            }
            if (date != null && (latestDate == null || date.isAfter(latestDate))) {
                latestDate = date;
            }
        }

        validationDate = latestDate != null ? latestDate : LocalDate.now();

        // Analyze sales records: new vs updates
        List<Sales> salesList = new ArrayList<>();
        int newSalesCount = 0;
        int updateSalesCount = 0;

        for (Map<String, Object> salesRow : salesRows) {
            try {
                Long idStore = getLongValue(salesRow, "id_store");
                Long idProduct = getLongValue(salesRow, "id_product");
                Integer quantity = getIntegerValue(salesRow, "quantity");
                LocalDateTime rangeDate = getDateTimeValue(salesRow, "range_date");

                if (idStore != null && idProduct != null && quantity != null && rangeDate != null) {
                    // Check if sales record already exists (same store, product, and date)
                    // Use the repository method that filters by store, product, and date
                    List<Sales> existingSalesSameDay = salesRepository.findByStoreProductAndDate(idStore, idProduct,
                            rangeDate);

                    Sales exactMatch = null;
                    Sales sameDayMatch = null;

                    // Look for exact timestamp match first
                    for (Sales s : existingSalesSameDay) {
                        if (s.getRangeDate().equals(rangeDate)) {
                            exactMatch = s;
                            break;
                        } else {
                            sameDayMatch = s; // Found on same day but different time
                        }
                    }

                    if (exactMatch == null && sameDayMatch == null) {
                        // No record found - this is NEW
                        newSalesCount++;
                        result.getNewSalesDetails().add(String.format(
                                "New: Store %d, Product %d, Quantity %d, Date %s",
                                idStore, idProduct, quantity, rangeDate));
                    } else if (exactMatch != null) {
                        // Exact timestamp match found - check if quantity changed
                        if (!exactMatch.getQuantity().equals(quantity)) {
                            updateSalesCount++;
                            result.getUpdateSalesDetails().add(String.format(
                                    "Update: Store %d, Product %d, Quantity changed from %d to %d, Date %s",
                                    idStore, idProduct, exactMatch.getQuantity(), quantity, rangeDate));
                        }
                        // If exact match with same quantity, it's not new or update (already exists)
                    } else {
                        // Same day but different timestamp - this is an UPDATE
                        updateSalesCount++;
                        result.getUpdateSalesDetails().add(String.format(
                                "Update: Store %d, Product %d, Date changed from %s to %s, Quantity %d",
                                idStore, idProduct, sameDayMatch.getRangeDate(), rangeDate, quantity));
                    }

                    Sales sale = new Sales();
                    sale.setIdStore(idStore);
                    sale.setIdProduct(idProduct);
                    sale.setQuantity(quantity);
                    sale.setRangeDate(rangeDate);
                    salesList.add(sale);
                }
            } catch (Exception e) {
                // Log exception for debugging
                result.getErrors().add("Sales row error: " + e.getMessage());
            }
        }

        result.setNewSalesRecords(newSalesCount);
        result.setUpdateSalesRecords(updateSalesCount);

        // Analyze transfer records: new vs updates
        List<Transfer> transferList = new ArrayList<>();
        int newTransferCount = 0;
        int updateTransferCount = 0;

        for (Map<String, Object> transferRow : transferRows) {
            try {
                LocalDateTime date = getDateTimeValue(transferRow, "date");
                Long idStoreSent = getLongValue(transferRow, "id_store_sent");
                Long idStoreReceive = getLongValue(transferRow, "id_store_receive");
                Long idProduct = getLongValue(transferRow, "id_product");
                Integer quantity = getIntegerValue(transferRow, "quantity");
                String status = getStringValue(transferRow, "status");

                if (date != null && idStoreSent != null && idStoreReceive != null &&
                        idProduct != null && quantity != null) {
                    // Check if transfer record already exists using EXACT timestamp match
                    // Different timestamp = different transfer (new record)
                    LocalDateTime startOfDay = date.toLocalDate().atStartOfDay();
                    LocalDateTime endOfDay = date.toLocalDate().atTime(23, 59, 59);
                    List<Transfer> transfersSameDay = transferRepository.findByDateBetween(startOfDay, endOfDay);
                    Transfer exactMatch = null;

                    for (Transfer t : transfersSameDay) {
                        if (t.getIdStoreSent().equals(idStoreSent) &&
                                t.getIdStoreReceive().equals(idStoreReceive) &&
                                t.getIdProduct().equals(idProduct) &&
                                t.getDate().equals(date)) {
                            exactMatch = t;
                            break;
                        }
                    }

                    if (exactMatch == null) {
                        // No exact timestamp match - this is a NEW transfer
                        newTransferCount++;
                        result.getNewTransferDetails().add(String.format(
                                "New: Store %d -> %d, Product %d, Quantity %d, Date %s, Status %s",
                                idStoreSent, idStoreReceive, idProduct, quantity, date,
                                status != null ? status : "in_transit"));
                    } else {
                        // Exact timestamp match found - check if anything changed (update)
                        boolean isUpdate = false;
                        List<String> changes = new ArrayList<>();

                        if (!exactMatch.getQuantity().equals(quantity)) {
                            isUpdate = true;
                            changes.add(String.format("Quantity: %d -> %d", exactMatch.getQuantity(), quantity));
                        }
                        String existingStatus = exactMatch.getStatus() != null ? exactMatch.getStatus() : "in_transit";
                        String newStatus = status != null ? status : "in_transit";
                        if (!existingStatus.equals(newStatus)) {
                            isUpdate = true;
                            changes.add(String.format("Status: %s -> %s", existingStatus, newStatus));
                        }

                        if (isUpdate) {
                            updateTransferCount++;
                            result.getUpdateTransferDetails().add(String.format(
                                    "Update: Store %d -> %d, Product %d, %s",
                                    idStoreSent, idStoreReceive, idProduct, String.join("; ", changes)));
                        }
                    }
                } else {
                    // Missing required fields - log for debugging
                    result.getErrors().add(String.format(
                            "Transfer row skipped: date=%s, idStoreSent=%s, idStoreReceive=%s, idProduct=%s, quantity=%s",
                            date, idStoreSent, idStoreReceive, idProduct, quantity));
                }
            } catch (Exception e) {
                // Log exception for debugging
                result.getErrors().add("Transfer row error: " + e.getMessage());
            }
        }

        // Set counts
        result.setNewSalesRecords(newSalesCount);
        result.setUpdateSalesRecords(updateSalesCount);
        result.setNewTransferRecords(newTransferCount);
        result.setUpdateTransferRecords(updateTransferCount);

        // Build transfer list for consistency check
        logger.info("Building transferList from {} transferRows", transferRows.size());
        for (int rowIdx = 0; rowIdx < transferRows.size(); rowIdx++) {
            Map<String, Object> transferRow = transferRows.get(rowIdx);
            try {
                logger.debug("Processing transferRow[{}], keys={}", rowIdx, transferRow.keySet());
                LocalDateTime date = getDateTimeValue(transferRow, "date");
                Long idStoreSent = getLongValue(transferRow, "id_store_sent");
                Long idStoreReceive = getLongValue(transferRow, "id_store_receive");
                Long idProduct = getLongValue(transferRow, "id_product");
                Integer quantity = getIntegerValue(transferRow, "quantity");
                String status = getStringValue(transferRow, "status");

                logger.info(
                        "Row[{}] parsed: date={}, idStoreSent={}, idStoreReceive={}, idProduct={}, quantity={}, status={}",
                        rowIdx, date, idStoreSent, idStoreReceive, idProduct, quantity, status);

                if (date != null && idStoreSent != null && idStoreReceive != null &&
                        idProduct != null && quantity != null) {
                    Transfer transfer = new Transfer();
                    transfer.setDate(date);
                    transfer.setIdStoreSent(idStoreSent);
                    transfer.setIdStoreReceive(idStoreReceive);
                    transfer.setIdProduct(idProduct);
                    transfer.setQuantity(quantity);
                    transfer.setStatus(status != null ? status : "in_transit");
                    transferList.add(transfer);
                    logger.info("Added transfer to list: {}->{}, Product {}, Qty {}, Status {}",
                            transfer.getIdStoreSent(), transfer.getIdStoreReceive(), transfer.getIdProduct(),
                            transfer.getQuantity(), transfer.getStatus());
                } else {
                    logger.warn(
                            "Row[{}] skipped - missing required fields: date={}, idStoreSent={}, idStoreReceive={}, idProduct={}, quantity={}",
                            rowIdx, date, idStoreSent, idStoreReceive, idProduct, quantity);
                }
            } catch (Exception e) {
                logger.error("Transfer list building error at row {}: {}", rowIdx, e.getMessage(), e);
            }
        }

        result.setNewTransferRecords(newTransferCount);
        result.setUpdateTransferRecords(updateTransferCount);

        // Log transfer list size and details (logs only, not in response)
        logger.info("Transfer processing complete: transferRows size={}, transferList size={}", transferRows.size(),
                transferList.size());
        if (transferList.isEmpty() && !transferRows.isEmpty()) {
            logger.warn("transferList is empty after processing {} transfer rows!", transferRows.size());
        } else if (!transferList.isEmpty()) {
            for (int i = 0; i < Math.min(3, transferList.size()); i++) {
                Transfer t = transferList.get(i);
                logger.debug("transferList[{}]: {}->{}  Product {}, Date {}, Status {}",
                        i, t.getIdStoreSent(), t.getIdStoreReceive(), t.getIdProduct(), t.getDate(), t.getStatus());
            }
        }

        // Analyze stock records (always updates if exists)
        int updateStockCount = 0;
        for (Map.Entry<String, Integer> stockEntry : stockData.entrySet()) {
            String[] parts = stockEntry.getKey().split("-");
            if (parts.length == 2) {
                try {
                    Long storeId = Long.parseLong(parts[0]);
                    Long productId = Long.parseLong(parts[1]);
                    Stock existingStock = stockRepository.findByIdStoreAndIdProduct(storeId, productId);
                    if (existingStock != null) {
                        updateStockCount++;
                    }
                } catch (Exception e) {
                    // Skip invalid entries
                }
            }
        }
        result.setUpdateStockRecords(updateStockCount);

        // Perform consistency validation
        logger.info(
                "About to call validateStockConsistency with transferList size={}, salesList size={}, validationDate={}",
                transferList.size(), salesList.size(), validationDate);
        List<String> validationErrors = validateStockConsistency(stockData, salesList, transferList, validationDate);
        logger.info("validateStockConsistency returned {} errors", validationErrors.size());
        result.getErrors().addAll(validationErrors);
        result.setValid(validationErrors.isEmpty());
        result.setMessage(validationErrors.isEmpty()
                ? String.format(
                        "Validation passed. New: %d sales, %d transfers. Updates: %d sales, %d transfers, %d stock",
                        newSalesCount, newTransferCount, updateSalesCount, updateTransferCount, updateStockCount)
                : String.format(
                        "Validation failed with %d error(s). New: %d sales, %d transfers. Updates: %d sales, %d transfers, %d stock",
                        validationErrors.size(), newSalesCount, newTransferCount, updateSalesCount, updateTransferCount,
                        updateStockCount));

        return result;
    }

    private Long getLongValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null)
            return null;
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Number)
            return ((Number) value).longValue();
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
        if (value == null)
            return null;
        if (value instanceof Integer)
            return (Integer) value;
        if (value instanceof Number)
            return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt(((String) value).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private LocalDateTime getDateTimeValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null)
            return null;
        if (value instanceof LocalDateTime)
            return (LocalDateTime) value;
        if (value instanceof LocalDate)
            return ((LocalDate) value).atStartOfDay();
        if (value instanceof String) {
            String dateStr = ((String) value).trim();
            try {
                // Try parsing as ISO datetime first (with T separator)
                return LocalDateTime.parse(dateStr);
            } catch (Exception e) {
                try {
                    // Try parsing with space separator (e.g., "2025-01-13 09:00:00")
                    return LocalDateTime.parse(dateStr,
                            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                } catch (Exception ex) {
                    try {
                        // Try parsing as date only and convert to start of day
                        return LocalDate.parse(dateStr).atStartOfDay();
                    } catch (Exception exc) {
                        logger.warn("Failed to parse date string: {}", dateStr);
                        return null;
                    }
                }
            }
        }
        return null;
    }

    private String getStringValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null)
            return null;
        if (value instanceof String)
            return (String) value;
        return value.toString();
    }

    /**
     * Validates consistency of current database data.
     * Checks all stock entries against recent sales and transfers to find
     * inconsistencies.
     * 
     * @param checkDate The date to check consistency for (typically today or a
     *                  specific date)
     * @return List of validation errors (empty if all data is consistent)
     */
    public List<String> validateCurrentDatabaseConsistency(LocalDate checkDate) {
        List<String> errors = new ArrayList<>();

        // Get all current stock entries
        List<Stock> allStocks = stockRepository.findAll();

        // Get sales for the check date (convert to start/end of day timestamps)
        LocalDateTime startOfDay = checkDate.atStartOfDay();
        LocalDateTime endOfDay = checkDate.atTime(23, 59, 59);
        List<Sales> salesForDate = salesRepository.findByRangeDateBetween(startOfDay, endOfDay);

        // Get transfers for the check date (convert to start/end of day timestamps)
        List<Transfer> transfersForDate = transferRepository.findByDateBetween(startOfDay, endOfDay);

        // Group sales by (storeId, productId) and sum quantities
        Map<String, Integer> salesByStoreProduct = new HashMap<>();
        for (Sales sale : salesForDate) {
            String key = sale.getIdStore() + "-" + sale.getIdProduct();
            salesByStoreProduct.put(key,
                    salesByStoreProduct.getOrDefault(key, 0) + sale.getQuantity());
        }

        // Group transfers by store-product
        Map<String, Integer> transfersReceivedByStoreProduct = new HashMap<>();
        Map<String, Integer> transfersSentByStoreProduct = new HashMap<>();

        for (Transfer transfer : transfersForDate) {
            // Only count transfers that are received (status = received or closed)
            // For in_transit, the stock hasn't changed yet
            if ("received".equals(transfer.getStatus()) || "closed".equals(transfer.getStatus())) {
                String receiveKey = transfer.getIdStoreReceive() + "-" + transfer.getIdProduct();
                transfersReceivedByStoreProduct.put(receiveKey,
                        transfersReceivedByStoreProduct.getOrDefault(receiveKey, 0) + transfer.getQuantity());
            }

            // Count sent transfers (they reduce stock when sent, regardless of status)
            String sentKey = transfer.getIdStoreSent() + "-" + transfer.getIdProduct();
            transfersSentByStoreProduct.put(sentKey,
                    transfersSentByStoreProduct.getOrDefault(sentKey, 0) + transfer.getQuantity());
        }

        // Check each stock entry for consistency
        for (Stock stock : allStocks) {
            Long storeId = stock.getIdStore();
            Long productId = stock.getIdProduct();
            Integer currentStock = stock.getQuantity();

            // Check for negative stock
            if (currentStock < 0) {
                errors.add(String.format(
                        "Negative stock detected for Store %d, Product %d: Current stock is %d",
                        storeId, productId, currentStock));
            }

            // Get sales for this store-product on check date
            Integer salesQuantity = salesByStoreProduct.getOrDefault(storeId + "-" + productId, 0);

            // Get transfers for this store-product on check date
            Integer transfersReceived = transfersReceivedByStoreProduct.getOrDefault(storeId + "-" + productId, 0);
            Integer transfersSent = transfersSentByStoreProduct.getOrDefault(storeId + "-" + productId, 0);

            // Check if stock would go negative after sales
            if (currentStock < salesQuantity) {
                errors.add(String.format(
                        "Insufficient stock for Store %d, Product %d: Current stock (%d) is less than sales (%d) on %s",
                        storeId, productId, currentStock, salesQuantity, checkDate));
            }

            // Check if stock would go negative after transfers sent
            if (currentStock < transfersSent) {
                errors.add(String.format(
                        "Insufficient stock for transfer from Store %d, Product %d: Current stock (%d) is less than transfers sent (%d) on %s",
                        storeId, productId, currentStock, transfersSent, checkDate));
            }

            // Calculate net change: +received -sent -sales
            Integer netChange = transfersReceived - transfersSent - salesQuantity;

            // If there's significant activity but stock seems inconsistent, flag it
            // (This is a heuristic check - we can't know previous stock without history)
            if (salesQuantity > 0 || transfersSent > 0 || transfersReceived > 0) {
                // If stock is zero but there were sales/transfers, it might be inconsistent
                // (unless stock was exactly enough and is now zero)
                if (currentStock == 0 && (salesQuantity > 0 || transfersSent > 0)) {
                    // This is actually consistent if stock was exactly enough
                    // But if there are transfers received, stock should be > 0
                    if (transfersReceived > 0) {
                        errors.add(String.format(
                                "Potential inconsistency for Store %d, Product %d: Stock is 0 but received transfers (%d) on %s",
                                storeId, productId, transfersReceived, checkDate));
                    }
                }
            }
        }

        return errors;
    }

    /**
     * Helper to generate a consistent key for matching events (sales/transfers).
     * Uses a specific date format to avoid toString() variations.
     */
    private String getEventKey(String prefix, LocalDateTime dateTime) {
        if (dateTime == null)
            return prefix + "-null";
        return prefix + "-" + dateTime.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    /**
     * Normalizes a status string for consistent matching.
     * Handles variations in case, spaces vs underscores, etc.
     */
    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "in_transit"; // Default
        }
        return status.toLowerCase().trim()
                .replace(" ", "_")
                .replace("-", "_");
    }
}
