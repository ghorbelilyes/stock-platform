package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.repository.StockRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stocks")
@CrossOrigin(origins = "*")
@Tag(name = "Stocks", description = "Stock management and query endpoints")
public class StockController {
    
    private final StockRepository stockRepository;
    
    @Autowired
    public StockController(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }
    
    @GetMapping
    @Operation(
        summary = "Get all stocks",
        description = "Retrieve stocks with optional filters by storeId and productId, with pagination support"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getAllStocks(
        @Parameter(description = "Filter by store ID") @RequestParam(required = false) Long storeId,
        @Parameter(description = "Filter by product ID") @RequestParam(required = false) Long productId,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
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
    
    @GetMapping("/store/{storeId}")
    @Operation(
        summary = "Get stocks by store ID",
        description = "Retrieve all stock entries for a specific store with pagination support"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getStocksByStoreId(
        @Parameter(description = "Store ID", required = true, example = "1") @PathVariable Long storeId,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockView> stocks = stockRepository.findByIdStoreView(storeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully for store ID: " + storeId));
    }
    
    @GetMapping("/product/{productId}")
    @Operation(
        summary = "Get stocks by product ID",
        description = "Retrieve all stock entries for a specific product across all stores with pagination support"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getStocksByProductId(
        @Parameter(description = "Product ID", required = true, example = "1") @PathVariable Long productId,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockView> stocks = stockRepository.findByIdProductView(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully for product ID: " + productId));
    }
}
