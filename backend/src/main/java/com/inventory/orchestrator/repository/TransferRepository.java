package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.dto.TransferView;
import com.inventory.orchestrator.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {
    
    List<Transfer> findByIdStoreSent(Long idStoreSent);
    
    List<Transfer> findByIdStoreReceive(Long idStoreReceive);
    
    List<Transfer> findByIdProduct(Long idProduct);
    
    List<Transfer> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find existing transfers by date, stores, and product (same day)
    @Query("SELECT t FROM Transfer t WHERE t.idStoreSent = :storeSent AND t.idStoreReceive = :storeReceive " +
           "AND t.idProduct = :productId AND FUNCTION('DATE', t.date) = FUNCTION('DATE', :date)")
    List<Transfer> findByStoresProductAndDate(
        @Param("storeSent") Long idStoreSent,
        @Param("storeReceive") Long idStoreReceive,
        @Param("productId") Long idProduct,
        @Param("date") LocalDateTime date
    );
    
    @Query("SELECT t FROM Transfer t WHERE t.idStoreSent = :storeSent OR t.idStoreReceive = :storeReceive")
    List<Transfer> findByStoreInvolved(@Param("storeSent") Long idStoreSent, @Param("storeReceive") Long idStoreReceive);

    @Query(
        value = "SELECT t FROM Transfer t " +
            "WHERE (:storeSent IS NULL OR t.idStoreSent = :storeSent) " +
            "AND (:storeReceive IS NULL OR t.idStoreReceive = :storeReceive) " +
            "AND (:productId IS NULL OR t.idProduct = :productId) " +
            "AND t.date >= :startDate " +
            "AND t.date <= :endDate " +
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
            "AND t.date >= :startDate " +
            "AND t.date <= :endDate " +
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
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("search") String search,
        Pageable pageable
    );

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.TransferView(" +
            "t.id, t.date, t.idStoreSent, t.idStoreReceive, t.idProduct, t.reason, t.quantity, t.status, " +
            "stSent.name, stRec.name, p.name) " +
            "FROM Transfer t " +
            "LEFT JOIN t.storeSent stSent " +
            "LEFT JOIN t.storeReceive stRec " +
            "LEFT JOIN t.product p " +
            "WHERE (:storeSent IS NULL OR t.idStoreSent = :storeSent) " +
            "AND (:storeReceive IS NULL OR t.idStoreReceive = :storeReceive) " +
            "AND (:productId IS NULL OR t.idProduct = :productId) " +
            "AND t.date >= :startDate " +
            "AND t.date <= :endDate " +
            "AND ( (:status IS NULL AND t.status <> 'rejected') OR ( :status IS NOT NULL AND t.status = :status ) ) " +
            "AND (:search IS NULL OR " +
            "LOWER(t.reason) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idStoreSent, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idStoreReceive, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idProduct, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.quantity, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(stSent.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(stRec.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ")",
        countQuery = "SELECT COUNT(t) FROM Transfer t " +
            "LEFT JOIN t.storeSent stSent " +
            "LEFT JOIN t.storeReceive stRec " +
            "LEFT JOIN t.product p " +
            "WHERE (:storeSent IS NULL OR t.idStoreSent = :storeSent) " +
            "AND (:storeReceive IS NULL OR t.idStoreReceive = :storeReceive) " +
            "AND (:productId IS NULL OR t.idProduct = :productId) " +
            "AND t.date >= :startDate " +
            "AND t.date <= :endDate " +
            "AND ( (:status IS NULL AND t.status <> 'rejected') OR ( :status IS NOT NULL AND t.status = :status ) ) " +
            "AND (:search IS NULL OR " +
            "LOWER(t.reason) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idStoreSent, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idStoreReceive, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.idProduct, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(CONCAT(t.quantity, '')) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(stSent.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(stRec.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ")"
    )
    Page<TransferView> findTransfersWithFiltersView(
        @Param("storeSent") Long storeSent,
        @Param("storeReceive") Long storeReceive,
        @Param("productId") Long productId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("search") String search,
        @Param("status") String status,
        Pageable pageable
    );

    /**
     * Sum quantities of approved or in-transit transfers by destination store and product.
     * This represents incoming quantity for a location (approved or shipped but not yet received).
     * Returns [storeId, productId, sum].
     */
    @Query("SELECT t.idStoreReceive, t.idProduct, SUM(t.quantity) FROM Transfer t WHERE t.status IN ('approved', 'in_transit') GROUP BY t.idStoreReceive, t.idProduct")
    List<Object[]> sumIncomingByStoreAndProduct();

    /** Sum quantities of in-transit transfers by source store and product. Returns [storeId, productId, sum]. */
    @Query("SELECT t.idStoreSent, t.idProduct, SUM(t.quantity) FROM Transfer t WHERE t.status = 'in_transit' GROUP BY t.idStoreSent, t.idProduct")
    List<Object[]> sumOutgoingInTransitByStoreAndProduct();
    
    /** Sum quantities of approved transfers by source store and product. Returns [storeId, productId, sum]. */
    @Query("SELECT t.idStoreSent, t.idProduct, SUM(t.quantity) FROM Transfer t WHERE t.status = 'approved' GROUP BY t.idStoreSent, t.idProduct")
    List<Object[]> sumOutgoingApprovedByStoreAndProduct();

    /**
     * Find transfers not yet received (status not in 'received', 'closed') where the given store
     * is either source or destination and the product matches. Used for stock row expansion.
     */
    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.TransferView(" +
            "t.id, t.date, t.idStoreSent, t.idStoreReceive, t.idProduct, t.reason, t.quantity, t.status, " +
            "stSent.name, stRec.name, p.name) " +
            "FROM Transfer t " +
            "LEFT JOIN t.storeSent stSent " +
            "LEFT JOIN t.storeReceive stRec " +
            "LEFT JOIN t.product p " +
            "WHERE (t.idStoreSent = :storeId OR t.idStoreReceive = :storeId) AND t.idProduct = :productId " +
            "AND t.status NOT IN ('received', 'closed') " +
            "ORDER BY t.date DESC"
    )
    List<TransferView> findTransfersByStoreAndProduct(@Param("storeId") Long storeId, @Param("productId") Long productId);
}
