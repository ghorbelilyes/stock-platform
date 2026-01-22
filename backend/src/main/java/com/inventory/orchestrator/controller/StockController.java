package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stocks")
@CrossOrigin(origins = "*")
public class StockController {
    
    private final StockRepository stockRepository;
    
    @Autowired
    public StockController(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Stock>>> getAllStocks(
        @RequestParam(required = false) Long storeId,
        @RequestParam(required = false) Long productId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Stock> stocks;
        
        if (storeId != null && productId != null) {
            Stock stock = stockRepository.findByIdStoreAndIdProduct(storeId, productId);
            if (stock != null) {
                stocks = Page.empty(pageable);
                // Create a page with single item
                stocks = new org.springframework.data.domain.PageImpl<>(List.of(stock), pageable, 1);
            } else {
                stocks = Page.empty(pageable);
            }
        } else if (storeId != null) {
            List<Stock> stockList = stockRepository.findByIdStore(storeId);
            stocks = new org.springframework.data.domain.PageImpl<>(stockList, pageable, stockList.size());
        } else if (productId != null) {
            List<Stock> stockList = stockRepository.findByIdProduct(productId);
            stocks = new org.springframework.data.domain.PageImpl<>(stockList, pageable, stockList.size());
        } else {
            stocks = stockRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully"));
    }
}
