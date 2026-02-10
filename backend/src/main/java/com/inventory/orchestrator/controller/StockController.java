package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stocks")
@CrossOrigin(origins = "*")
@Tag(name = "Stocks", description = "Stock management and query endpoints")
public class StockController {
    
    private final StockService stockService;
    
    @Autowired
    public StockController(StockService stockService) {
        this.stockService = stockService;
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(
        summary = "Get all stocks",
        description = "Retrieve stocks with optional filters by storeId and productId, with pagination support"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getAllStocks(
        @Parameter(description = "Filter by store ID") @RequestParam(required = false) Long storeId,
        @Parameter(description = "Filter by product ID") @RequestParam(required = false) Long productId,
        @Parameter(description = "Sort field and direction (e.g., 'store.name,asc')") @RequestParam(required = false) String sort,
        @Parameter(description = "Global search term") @RequestParam(required = false) String search,
        @Parameter(description = "Filter by store name") @RequestParam(required = false) String storeName,
        @Parameter(description = "Filter by product name") @RequestParam(required = false) String productName,
        @Parameter(description = "Filter by city") @RequestParam(required = false) String city,
        @Parameter(description = "Filter by store type") @RequestParam(required = false) String type,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        Page<StockView> stocks = stockService.getStocksWithTransfers(
            storeId,
            productId,
            normalize(search),
            normalize(storeName),
            normalize(productName),
            normalize(city),
            normalize(type),
            pageable
        );
        
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully"));
    }
    
    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(
        summary = "Get stocks by store ID",
        description = "Retrieve all stock entries for a specific store with pagination and incoming/outgoing transfer quantities"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getStocksByStoreId(
        @Parameter(description = "Store ID", required = true, example = "1") @PathVariable Long storeId,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockView> stocks = stockService.getStocksByStoreIdWithTransfers(storeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully for store ID: " + storeId));
    }
    
    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(
        summary = "Get stocks by product ID",
        description = "Retrieve all stock entries for a specific product across all stores with pagination and incoming/outgoing transfer quantities"
    )
    public ResponseEntity<ApiResponse<Page<StockView>>> getStocksByProductId(
        @Parameter(description = "Product ID", required = true, example = "1") @PathVariable Long productId,
        @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockView> stocks = stockService.getStocksByProductIdWithTransfers(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(stocks, "Stocks retrieved successfully for product ID: " + productId));
    }

    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.ASC, "idStore");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
        if (!isValidSortField(field)) {
            field = "idStore";
        }
        
        if (parts.length > 1) {
            String direction = parts[1].trim().toLowerCase();
            if ("desc".equals(direction)) {
                return Sort.by(Sort.Direction.DESC, field);
            }
        }
        
        return Sort.by(Sort.Direction.ASC, field);
    }
    
    private boolean isValidSortField(String field) {
        if (field == null || field.isEmpty()) {
            return false;
        }
        return field.matches("^[a-zA-Z0-9_.]+$");
    }
    
    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase();
    }
}
