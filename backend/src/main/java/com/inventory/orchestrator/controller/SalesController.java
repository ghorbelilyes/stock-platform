package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.SalesView;
import com.inventory.orchestrator.repository.SalesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String storeName,
        @RequestParam(required = false) String productName,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        // Convert LocalDate to LocalDateTime for query (start of day to end of day)
        // Use sentinel values when null to ensure parameters are always typed
        LocalDateTime startDateTime = (startDate != null) ? startDate.atStartOfDay() : LocalDateTime.of(1900, 1, 1, 0, 0);
        LocalDateTime endDateTime = (endDate != null) ? endDate.atTime(23, 59, 59) : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        
        Page<SalesView> sales = salesRepository.findViewsWithFilters(
            storeId,
            productId,
            normalize(search),
            normalize(storeName),
            normalize(productName),
            normalize(city),
            startDateTime,
            endDateTime,
            pageable
        );
        
        return ResponseEntity.ok(ApiResponse.success(sales, "Sales retrieved successfully"));
    }

    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "rangeDate");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
        if (!isValidSortField(field)) {
            field = "rangeDate";
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
