package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Store;
import com.inventory.orchestrator.repository.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stores")
@CrossOrigin(origins = "*")
public class StoreController {
    
    private final StoreRepository storeRepository;
    
    @Autowired
    public StoreController(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }
    
    /**
     * Get stores with pagination, sorting, filtering, and search
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Page<Store>>> getAllStores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type
    ) {
        // Validate page and size
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        
        // Parse sort parameter
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        Page<Store> stores;
        
        // Priority: search > individual filters > all stores
        if (search != null && !search.trim().isEmpty()) {
            stores = storeRepository.searchStores(search.trim(), pageable);
        } else if (name != null && !name.trim().isEmpty()) {
            stores = storeRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        } else if (serialNumber != null && !serialNumber.trim().isEmpty()) {
            stores = storeRepository.findBySerialNumberContainingIgnoreCase(serialNumber.trim(), pageable);
        } else if (city != null && !city.trim().isEmpty()) {
            stores = storeRepository.findByCityContainingIgnoreCase(city.trim(), pageable);
        } else if (type != null && !type.trim().isEmpty()) {
            stores = storeRepository.findByTypeContainingIgnoreCase(type.trim(), pageable);
        } else {
            stores = storeRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(stores, "Stores retrieved successfully"));
    }
    
    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.ASC, "id");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
        if (!isValidSortField(field)) {
            field = "id";
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
        return field.matches("^[a-zA-Z0-9_]+$");
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Store>> getStoreById(@PathVariable Long id) {
        return storeRepository.findById(id)
            .map(store -> ResponseEntity.ok(ApiResponse.success(store, "Store retrieved successfully")))
            .orElse(ResponseEntity.ok(ApiResponse.<Store>error("NOT_FOUND", "Store not found", java.util.Collections.emptyList())));
    }
}
