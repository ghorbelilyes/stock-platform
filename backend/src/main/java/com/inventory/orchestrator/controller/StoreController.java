package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Store;
import com.inventory.orchestrator.repository.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores")
@CrossOrigin(origins = "*")
public class StoreController {
    
    private final StoreRepository storeRepository;
    
    @Autowired
    public StoreController(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Store>>> getAllStores(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String city
    ) {
        List<Store> stores;
        
        if (type != null && city != null) {
            stores = storeRepository.findByCityAndType(city, type);
        } else if (type != null) {
            stores = storeRepository.findByType(type);
        } else if (city != null) {
            stores = storeRepository.findByCity(city);
        } else {
            stores = storeRepository.findAll();
        }
        
        return ResponseEntity.ok(ApiResponse.success(stores, "Stores retrieved successfully"));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Store>> getStoreById(@PathVariable Long id) {
        return storeRepository.findById(id)
            .map(store -> ResponseEntity.ok(ApiResponse.success(store, "Store retrieved successfully")))
            .orElse(ResponseEntity.ok(ApiResponse.<Store>error("NOT_FOUND", "Store not found", java.util.Collections.emptyList())));
    }
}
