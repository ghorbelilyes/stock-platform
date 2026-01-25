package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.StockView;
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
    public ResponseEntity<ApiResponse<Page<StockView>>> getAllStocks(
        @RequestParam(required = false) Long storeId,
        @RequestParam(required = false) Long productId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockView> stocks;
        
        if (storeId != null && productId != null) {
            stocks = stockRepository.findByIdStoreAndIdProductView(storeId, productId, pageable);
        } else if (storeId != null) {
            stocks = stockRepository.findByIdStoreView(storeId, pageable);
        } else if (productId != null) {
            stocks = stockRepository.findByIdProductView(productId, pageable);
        } else {
            stocks = stockRepository.findAllViews(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully"));
    }
}
