package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.SalesView;
import com.inventory.orchestrator.repository.SalesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/sales")
@CrossOrigin(origins = "*")
public class SalesController {
    
    private final SalesRepository salesRepository;
    
    @Autowired
    public SalesController(SalesRepository salesRepository) {
        this.salesRepository = salesRepository;
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SalesView>>> getAllSales(
        @RequestParam(required = false) Long storeId,
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SalesView> sales;
        
        if (storeId != null && startDate != null && endDate != null) {
            sales = salesRepository.findByStoreAndDateRangeView(storeId, startDate, endDate, pageable);
        } else if (storeId != null) {
            sales = salesRepository.findByIdStoreView(storeId, pageable);
        } else if (productId != null) {
            sales = salesRepository.findByIdProductView(productId, pageable);
        } else if (startDate != null && endDate != null) {
            sales = salesRepository.findByRangeDateBetweenView(startDate, endDate, pageable);
        } else {
            sales = salesRepository.findAllViews(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(sales, "Sales retrieved successfully"));
    }
}
