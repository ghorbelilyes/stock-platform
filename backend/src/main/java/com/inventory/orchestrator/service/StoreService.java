package com.inventory.orchestrator.service;

import com.inventory.orchestrator.entity.Store;
import com.inventory.orchestrator.repository.StoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Domain service for Store data. Used by AI Agent and other services.
 * Read-focused; no direct repository access from AI logic.
 */
@Service
public class StoreService {

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public List<Store> findAll() {
        return storeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Store> findById(Long id) {
        return storeRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Store> findByType(String type) {
        return storeRepository.findByType(type);
    }

    @Transactional(readOnly = true)
    public List<Store> findWarehouses() {
        return storeRepository.findByType("warehouse");
    }

    @Transactional(readOnly = true)
    public List<Store> findStores() {
        return storeRepository.findByType("store");
    }
}
