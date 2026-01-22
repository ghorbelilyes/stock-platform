package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    
    List<Store> findByType(String type);
    
    List<Store> findByCity(String city);
    
    List<Store> findByCityAndType(String city, String type);
    
    java.util.Optional<Store> findBySerialNumber(String serialNumber);
}
