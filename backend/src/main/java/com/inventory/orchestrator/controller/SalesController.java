package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Sales;
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
    public ResponseEntity<ApiResponse<Page<Sales>>> getAllSales(
        @RequestParam(required = false) Long storeId,
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Sales> sales;
        
        if (storeId != null && startDate != null && endDate != null) {
            sales = salesRepository.findByStoreAndDateRange(storeId, startDate, endDate, pageable);
        } else if (storeId != null) {
            List<Sales> salesList = salesRepository.findByIdStore(storeId);
            sales = new org.springframework.data.domain.PageImpl<>(salesList, pageable, salesList.size());
        } else if (productId != null) {
            List<Sales> salesList = salesRepository.findByIdProduct(productId);
            sales = new org.springframework.data.domain.PageImpl<>(salesList, pageable, salesList.size());
        } else if (startDate != null && endDate != null) {
            List<Sales> salesList = salesRepository.findByRangeDateBetween(startDate, endDate);
            sales = new org.springframework.data.domain.PageImpl<>(salesList, pageable, salesList.size());
        } else {
            sales = salesRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(sales, "Sales retrieved successfully"));
    }
}
