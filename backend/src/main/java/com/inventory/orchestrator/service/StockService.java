package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.repository.StockRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enriches stock data with incoming/outgoing quantities from in-transit transfers (single API call).
 */
@Service
public class StockService {

    private final StockRepository stockRepository;
    private final TransferRepository transferRepository;

    public StockService(StockRepository stockRepository, TransferRepository transferRepository) {
        this.stockRepository = stockRepository;
        this.transferRepository = transferRepository;
    }

    public Page<StockView> getStocksWithTransfers(
            Long storeId,
            Long productId,
            String search,
            String storeName,
            String productName,
            String city,
            String type,
            Pageable pageable
    ) {
        Page<StockView> page = stockRepository.findViewsWithFilters(
                storeId, productId, search, storeName, productName, city, type, pageable
        );
        enrichWithTransfers(page.getContent());
        return page;
    }

    public Page<StockView> getStocksByStoreIdWithTransfers(Long storeId, Pageable pageable) {
        Page<StockView> page = stockRepository.findByIdStoreView(storeId, pageable);
        enrichWithTransfers(page.getContent());
        return page;
    }

    public Page<StockView> getStocksByProductIdWithTransfers(Long productId, Pageable pageable) {
        Page<StockView> page = stockRepository.findByIdProductView(productId, pageable);
        enrichWithTransfers(page.getContent());
        return page;
    }

    private void enrichWithTransfers(List<StockView> content) {
        if (content == null || content.isEmpty()) return;
        Map<String, Integer> incoming = buildIncomingMap();
        Map<String, Integer> outToTransit = buildOutToTransitMap();
        Map<String, Integer> quantityForTransfer = buildQuantityForTransferMap();
        for (StockView row : content) {
            String k = key(row.getIdStore(), row.getIdProduct());
            row.setIncomingQty(incoming.getOrDefault(k, 0));
            row.setOutToTransit(outToTransit.getOrDefault(k, 0));
            row.setQuantityForTransfer(quantityForTransfer.getOrDefault(k, 0));
        }
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
