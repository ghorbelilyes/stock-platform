package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query(
        value = "SELECT t FROM Transfer t " +
            "WHERE (:storeSent IS NULL OR t.idStoreSent = :storeSent) " +
            "AND (:storeReceive IS NULL OR t.idStoreReceive = :storeReceive) " +
            "AND (:productId IS NULL OR t.idProduct = :productId) " +
            "AND (CAST(:startDate AS date) IS NULL OR CAST(:endDate AS date) IS NULL OR t.date BETWEEN :startDate AND :endDate) " +
            "AND (:search IS NULL OR " +
                "LOWER(t.reason) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idStoreSent, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idStoreReceive, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idProduct, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.quantity, '')) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ")",
        countQuery = "SELECT COUNT(t) FROM Transfer t " +
            "WHERE (:storeSent IS NULL OR t.idStoreSent = :storeSent) " +
            "AND (:storeReceive IS NULL OR t.idStoreReceive = :storeReceive) " +
            "AND (:productId IS NULL OR t.idProduct = :productId) " +
            "AND (CAST(:startDate AS date) IS NULL OR CAST(:endDate AS date) IS NULL OR t.date BETWEEN :startDate AND :endDate) " +
            "AND (:search IS NULL OR " +
                "LOWER(t.reason) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idStoreSent, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idStoreReceive, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.idProduct, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(CONCAT(t.quantity, '')) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ")"
    )
    Page<Transfer> findTransfersWithFilters(
        @Param("storeSent") Long storeSent,
        @Param("storeReceive") Long storeReceive,
        @Param("productId") Long productId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("search") String search,
        Pageable pageable
    );
}
