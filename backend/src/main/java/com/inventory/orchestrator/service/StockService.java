package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.repository.StockRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import com.inventory.orchestrator.repository.SalesRepository;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enriches stock data with incoming/outgoing quantities from in-transit
 * transfers (single API call).
 */
@Service
public class StockService {

    private final StockRepository stockRepository;
    private final TransferRepository transferRepository;
    private final SalesRepository salesRepository;

    private final SettingsService settingsService;

    public StockService(StockRepository stockRepository, TransferRepository transferRepository,
            SalesRepository salesRepository, SettingsService settingsService) {
        this.stockRepository = stockRepository;
        this.transferRepository = transferRepository;
        this.salesRepository = salesRepository;
        this.settingsService = settingsService;
    }

    public Page<StockView> getStocksWithTransfers(
            Long storeId,
            Long productId,
            String search,
            String storeName,
            String productName,
            String city,
            String type,
            Pageable pageable) {
        Page<StockView> page = stockRepository.findViewsWithFilters(
                storeId, productId, search, storeName, productName, city, type, pageable);
        enrichData(page.getContent());

        return page;
    }

    public Page<StockView> getStocksByStoreIdWithTransfers(Long storeId, Pageable pageable) {
        Page<StockView> page = stockRepository.findByIdStoreView(storeId, pageable);
        enrichData(page.getContent());

        return page;
    }

    public Page<StockView> getStocksByProductIdWithTransfers(Long productId, Pageable pageable) {
        Page<StockView> page = stockRepository.findByIdProductView(productId, pageable);
        enrichData(page.getContent());

        return page;
    }

    private void enrichData(List<StockView> content) {
        if (content == null || content.isEmpty())
            return;

        // Determine lookback days once
        int lookbackDays = 30; // default
        if (settingsService != null) {
            String enabled = settingsService.getString("sales.lookback.enabled");
            if ("true".equalsIgnoreCase(enabled)) {
                lookbackDays = settingsService.getInt("sales.lookback.days");
            }
        }
        if (lookbackDays <= 0)
            lookbackDays = 30;

        Map<String, Integer> incoming = buildIncomingMap();
        Map<String, Integer> outToTransit = buildOutToTransitMap();
        Map<String, Integer> quantityForTransfer = buildQuantityForTransferMap();
        Map<String, Integer> salesMap = buildSalesMap(lookbackDays);

        for (StockView row : content) {
            String k = key(row.getIdStore(), row.getIdProduct());
            row.setIncomingQty(incoming.getOrDefault(k, 0));
            row.setOutToTransit(outToTransit.getOrDefault(k, 0));
            row.setQuantityForTransfer(quantityForTransfer.getOrDefault(k, 0));

            // Sales metrics
            int sold = salesMap.getOrDefault(k, 0);
            row.setSoldLast30Days(sold); // Legacy field, keeping for compatibility
            row.setSoldLastNDays(sold); // New field

            double avg = (double) sold / lookbackDays;
            // Round to 2 decimals
            avg = Math.round(avg * 100.0) / 100.0;
            row.setAvgDailySales(avg);

            if (avg > 0.001) {
                int qty = row.getQuantity() != null ? row.getQuantity() : 0;
                double cover = qty / avg;
                row.setDaysOfCover(Math.round(cover * 10.0) / 10.0);
            } else {
                row.setDaysOfCover(0.0);
            }
        }
    }

    private Map<String, Integer> buildSalesMap(int lookbackDays) {
        Map<String, Integer> map = new HashMap<>();
        try {
            LocalDateTime end = LocalDateTime.now();
            LocalDateTime start = end.minusDays(lookbackDays);

            // Strictly respect the lookback window. If no sales, rows will be empty.
            List<Object[]> rows = salesRepository.sumSalesByStoreAndProductBetween(start, end);

            for (Object[] row : rows) {
                Long storeId = ((Number) row[0]).longValue();
                Long productId = ((Number) row[1]).longValue();
                Number sum = (Number) row[2];
                map.put(key(storeId, productId), sum != null ? sum.intValue() : 0);
            }
        } catch (Exception e) {
            System.err.println("Error fetching sales sums: " + e.getMessage());
        }
        return map;
    }

    private static String key(Long storeId, Long productId) {
        return storeId + "-" + productId;
    }

    private Map<String, Integer> buildIncomingMap() {
        Map<String, Integer> map = new HashMap<>();
        try {
            List<Object[]> rows = transferRepository.sumIncomingByStoreAndProduct();
            for (Object[] row : rows) {
                Long storeId = ((Number) row[0]).longValue();
                Long productId = ((Number) row[1]).longValue();
                Number sum = (Number) row[2];
                map.put(key(storeId, productId), sum != null ? sum.intValue() : 0);
            }
        } catch (Exception e) {
            // If status column or table not ready, return empty map
        }
        return map;
    }

    private Map<String, Integer> buildOutToTransitMap() {
        Map<String, Integer> map = new HashMap<>();
        try {
            List<Object[]> rows = transferRepository.sumOutgoingInTransitByStoreAndProduct();
            for (Object[] row : rows) {
                Long storeId = ((Number) row[0]).longValue();
                Long productId = ((Number) row[1]).longValue();
                Number sum = (Number) row[2];
                map.put(key(storeId, productId), sum != null ? sum.intValue() : 0);
            }
        } catch (Exception e) {
            // If status column or table not ready, return empty map
        }
        return map;
    }

    private Map<String, Integer> buildQuantityForTransferMap() {
        Map<String, Integer> map = new HashMap<>();
        try {
            List<Object[]> rows = transferRepository.sumOutgoingApprovedByStoreAndProduct();
            for (Object[] row : rows) {
                Long storeId = ((Number) row[0]).longValue();
                Long productId = ((Number) row[1]).longValue();
                Number sum = (Number) row[2];
                map.put(key(storeId, productId), sum != null ? sum.intValue() : 0);
            }
        } catch (Exception e) {
            // If status column or table not ready, return empty map
        }
        return map;
    }
}
