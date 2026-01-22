package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Sales;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesRepository extends JpaRepository<Sales, Long> {
    
    List<Sales> findByIdStore(Long idStore);
    
    List<Sales> findByIdProduct(Long idProduct);
    
    List<Sales> findByRangeDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT s FROM Sales s WHERE s.idStore = :storeId AND s.rangeDate BETWEEN :startDate AND :endDate")
    Page<Sales> findByStoreAndDateRange(
        @Param("storeId") Long idStore,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}
