package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {
    
    List<Transfer> findByIdStoreSent(Long idStoreSent);
    
    List<Transfer> findByIdStoreReceive(Long idStoreReceive);
    
    List<Transfer> findByIdProduct(Long idProduct);
    
    List<Transfer> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT t FROM Transfer t WHERE t.idStoreSent = :storeSent OR t.idStoreReceive = :storeReceive")
    List<Transfer> findByStoreInvolved(@Param("storeSent") Long idStoreSent, @Param("storeReceive") Long idStoreReceive);
}
