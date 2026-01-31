package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.entity.StockId;
import com.inventory.orchestrator.repository.StockRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Domain service for Stock data. Used by AI Agent and StockAnalysisService.
 * AI has read-only access; stock updates only on explicit human-approved transfer execution.
 */
@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    /**
     * Apply an approved transfer: deduct from sender, add to receiver.
     * Called only after human approval. Enforces quantity and existence.
     */
    @Transactional
    public void applyTransfer(Long fromStoreId, Long toStoreId, Long productId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        Stock fromStock = stockRepository.findByIdStoreAndIdProduct(fromStoreId, productId);
        if (fromStock == null || fromStock.getQuantity() < quantity) {
            throw new IllegalStateException("Sender has insufficient stock");
        }
        fromStock.setQuantity(fromStock.getQuantity() - quantity);
        stockRepository.save(fromStock);

        Stock toStock = stockRepository.findByIdStoreAndIdProduct(toStoreId, productId);
        if (toStock == null) {
            toStock = new Stock(toStoreId, productId, quantity);
        } else {
            toStock.setQuantity(toStock.getQuantity() + quantity);
        }
        stockRepository.save(toStock);
    }

    @Transactional(readOnly = true)
    public List<Stock> findByStoreId(Long storeId) {
        return stockRepository.findByIdStore(storeId);
    }

    @Transactional(readOnly = true)
    public List<Stock> findByProductId(Long productId) {
        return stockRepository.findByIdProduct(productId);
    }

    @Transactional(readOnly = true)
    public Optional<Stock> findByStoreAndProduct(Long storeId, Long productId) {
        Stock stock = stockRepository.findByIdStoreAndIdProduct(storeId, productId);
        return Optional.ofNullable(stock);
    }

    @Transactional(readOnly = true)
    public Integer getQuantity(Long storeId, Long productId) {
        return findByStoreAndProduct(storeId, productId)
                .map(Stock::getQuantity)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<Stock> findAll() {
        return stockRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<StockView> findStocksWithQuantityLessThan(int maxQuantity, int limit) {
        int size = Math.min(Math.max(1, limit), 500);
        return stockRepository.findViewsWithQuantityLessThan(maxQuantity, PageRequest.of(0, size)).getContent();
    }

    @Transactional(readOnly = true)
    public List<StockView> findStocksWithQuantityGreaterThan(int minQuantity, int limit) {
        int size = Math.min(Math.max(1, limit), 500);
        return stockRepository.findViewsWithQuantityGreaterThan(minQuantity, PageRequest.of(0, size)).getContent();
    }

    /** Quantity strictly between minExclusive and maxExclusive (e.g. more than 100 and less than 150). */
    @Transactional(readOnly = true)
    public List<StockView> findStocksWithQuantityBetween(int minExclusive, int maxExclusive, int limit) {
        int size = Math.min(Math.max(1, limit), 500);
        return stockRepository.findViewsWithQuantityBetween(minExclusive, maxExclusive, PageRequest.of(0, size)).getContent();
    }
}
