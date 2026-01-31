package com.inventory.orchestrator.service;

import com.inventory.orchestrator.entity.Sales;
import com.inventory.orchestrator.repository.SalesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Domain service for Sales data. Used by AI Agent and StockAnalysisService
 * to compute average daily sales over the last 30 days.
 */
@Service
public class SalesService {

    private static final int DEFAULT_LOOKBACK_DAYS = 30;

    private final SalesRepository salesRepository;

    public SalesService(SalesRepository salesRepository) {
        this.salesRepository = salesRepository;
    }

    @Transactional(readOnly = true)
    public List<Sales> findByStoreAndProductAndDateRange(Long storeId, Long productId,
                                                        LocalDate startDate, LocalDate endDate) {
        return salesRepository.findByRangeDateBetween(startDate, endDate).stream()
                .filter(s -> s.getIdStore().equals(storeId) && s.getIdProduct().equals(productId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Sales> findByStoreAndDateRange(Long storeId, LocalDate startDate, LocalDate endDate) {
        return salesRepository.findByRangeDateBetween(startDate, endDate).stream()
                .filter(s -> s.getIdStore().equals(storeId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Sales> findByStoreAndProductInLastDays(Long storeId, Long productId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return findByStoreAndProductAndDateRange(storeId, productId, start, end);
    }

    /**
     * Sum of sales quantity for (store, product) over the last N days.
     */
    @Transactional(readOnly = true)
    public int totalQuantitySold(Long storeId, Long productId, int days) {
        List<Sales> sales = findByStoreAndProductInLastDays(storeId, productId, days);
        return sales.stream().mapToInt(Sales::getQuantity).sum();
    }

    @Transactional(readOnly = true)
    public double averageDailySales(Long storeId, Long productId, int days) {
        int total = totalQuantitySold(storeId, productId, days);
        return days > 0 ? (double) total / days : 0.0;
    }

    @Transactional(readOnly = true)
    public double averageDailySalesLast30Days(Long storeId, Long productId) {
        return averageDailySales(storeId, productId, DEFAULT_LOOKBACK_DAYS);
    }
}
