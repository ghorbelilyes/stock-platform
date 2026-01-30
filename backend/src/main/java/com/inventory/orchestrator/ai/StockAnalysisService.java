package com.inventory.orchestrator.ai;

import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.entity.Store;
import com.inventory.orchestrator.service.SalesService;
import com.inventory.orchestrator.service.StockService;
import com.inventory.orchestrator.service.StoreService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Deterministic stock analysis: avgDailySales (last 30 days), minQty, maxQty, status LOW/OK/EXCESS.
 * Used by AI Agent to propose transfers. No stock modification.
 */
@Service
public class StockAnalysisService {

    private static final int LOOKBACK_DAYS = 30;

    private final StockService stockService;
    private final SalesService salesService;
    private final StoreService storeService;

    public StockAnalysisService(StockService stockService, SalesService salesService, StoreService storeService) {
        this.stockService = stockService;
        this.salesService = salesService;
        this.storeService = storeService;
    }

    @Transactional(readOnly = true)
    public StockAnalysisResult analyze(Long storeId, Long productId) {
        Optional<Store> storeOpt = storeService.findById(storeId);
        int leadTimeDays = storeOpt.map(s -> s.getLeadTimeDays() != null ? s.getLeadTimeDays() : 1).orElse(1);
        if (leadTimeDays <= 0) leadTimeDays = 1;

        int quantity = stockService.getQuantity(storeId, productId);
        double avgDailySales = salesService.averageDailySales(storeId, productId, LOOKBACK_DAYS);
        double minQty = avgDailySales * leadTimeDays;
        double maxQty = minQty * 2;

        StockAnalysisResult r = new StockAnalysisResult();
        r.setStoreId(storeId);
        r.setProductId(productId);
        r.setQuantity(quantity);
        r.setAvgDailySales(avgDailySales);
        r.setLeadTimeDays(leadTimeDays);
        r.setMinQty(minQty);
        r.setMaxQty(maxQty);

        if (quantity < minQty) {
            r.setStatus(StockStatus.LOW);
            r.setNeededQty(minQty - quantity);
            r.setExcessQty(0);
        } else if (quantity > maxQty) {
            r.setStatus(StockStatus.EXCESS);
            r.setNeededQty(0);
            r.setExcessQty(quantity - maxQty);
        } else {
            r.setStatus(StockStatus.OK);
            r.setNeededQty(0);
            r.setExcessQty(0);
        }
        return r;
    }

    @Transactional(readOnly = true)
    public List<StockAnalysisResult> analyzeAll() {
        List<Stock> allStocks = stockService.findAll();
        List<StockAnalysisResult> results = new ArrayList<>();
        for (Stock s : allStocks) {
            results.add(analyze(s.getIdStore(), s.getIdProduct()));
        }
        return results;
    }

    @Transactional(readOnly = true)
    public List<StockAnalysisResult> getLowStocks() {
        return analyzeAll().stream()
                .filter(r -> r.getStatus() == StockStatus.LOW)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockAnalysisResult> getExcessStocks() {
        return analyzeAll().stream()
                .filter(r -> r.getStatus() == StockStatus.EXCESS)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockAnalysisResult> getExcessStocksForProduct(Long productId) {
        return getExcessStocks().stream()
                .filter(r -> r.getProductId().equals(productId))
                .toList();
    }

    /**
     * Excess stocks that are warehouses (priority source for transfers).
     */
    @Transactional(readOnly = true)
    public List<StockAnalysisResult> getExcessWarehousesForProduct(Long productId) {
        List<StockAnalysisResult> excess = getExcessStocksForProduct(productId);
        List<StockAnalysisResult> warehouses = new ArrayList<>();
        for (StockAnalysisResult r : excess) {
            storeService.findById(r.getStoreId()).ifPresent(store -> {
                if ("warehouse".equalsIgnoreCase(store.getType())) {
                    warehouses.add(r);
                }
            });
        }
        return warehouses;
    }

    /**
     * Excess stocks that are stores (fallback when no warehouse has excess).
     */
    @Transactional(readOnly = true)
    public List<StockAnalysisResult> getExcessStoresForProduct(Long productId) {
        List<StockAnalysisResult> excess = getExcessStocksForProduct(productId);
        List<StockAnalysisResult> stores = new ArrayList<>();
        for (StockAnalysisResult r : excess) {
            storeService.findById(r.getStoreId()).ifPresent(store -> {
                if ("store".equalsIgnoreCase(store.getType())) {
                    stores.add(r);
                }
            });
        }
        return stores;
    }
}
