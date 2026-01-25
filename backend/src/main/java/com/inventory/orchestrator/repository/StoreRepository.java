package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    
    List<Store> findByType(String type);
    
    List<Store> findByCity(String city);
    
    List<Store> findByCityAndType(String city, String type);
    
    java.util.Optional<Store> findBySerialNumber(String serialNumber);
    
    // Search stores by name, serialNumber, city, or type (case-insensitive)
    @Query("SELECT s FROM Store s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.type) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Store> searchStores(@Param("search") String search, Pageable pageable);
    
    // Filter by name
    Page<Store> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Filter by serialNumber
    Page<Store> findBySerialNumberContainingIgnoreCase(String serialNumber, Pageable pageable);
    
    // Filter by city
    Page<Store> findByCityContainingIgnoreCase(String city, Pageable pageable);
    
    // Filter by type
    Page<Store> findByTypeContainingIgnoreCase(String type, Pageable pageable);
}
