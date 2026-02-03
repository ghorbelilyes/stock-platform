package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.dto.SalesView;
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

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p",
        countQuery = "SELECT COUNT(s) FROM Sales s"
    )
    Page<SalesView> findAllViews(Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p " +
        "WHERE s.idStore = :storeId",
        countQuery = "SELECT COUNT(s) FROM Sales s WHERE s.idStore = :storeId"
    )
    Page<SalesView> findByIdStoreView(@Param("storeId") Long storeId, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p " +
        "WHERE s.idProduct = :productId",
        countQuery = "SELECT COUNT(s) FROM Sales s WHERE s.idProduct = :productId"
    )
    Page<SalesView> findByIdProductView(@Param("productId") Long productId, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p " +
        "WHERE s.rangeDate BETWEEN :startDate AND :endDate",
        countQuery = "SELECT COUNT(s) FROM Sales s WHERE s.rangeDate BETWEEN :startDate AND :endDate"
    )
    Page<SalesView> findByRangeDateBetweenView(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p " +
        "WHERE s.idStore = :storeId AND s.rangeDate BETWEEN :startDate AND :endDate",
        countQuery = "SELECT COUNT(s) FROM Sales s WHERE s.idStore = :storeId AND s.rangeDate BETWEEN :startDate AND :endDate"
    )
    Page<SalesView> findByStoreAndDateRangeView(
        @Param("storeId") Long storeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.SalesView(" +
            "s.id, s.rangeDate, s.idStore, s.idProduct, s.quantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Sales s JOIN s.store st JOIN s.product p " +
        "WHERE (:storeId IS NULL OR s.idStore = :storeId) " +
        "AND (:productId IS NULL OR s.idProduct = :productId) " +
        "AND (CAST(:startDate AS date) IS NULL OR CAST(:endDate AS date) IS NULL OR s.rangeDate BETWEEN :startDate AND :endDate) " +
        "AND (:search IS NULL OR " +
            "LOWER(st.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(st.city) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.codeBarre) LIKE CONCAT('%', CAST(:search AS string), '%')" +
        ") " +
        "AND (:storeName IS NULL OR LOWER(st.name) LIKE CONCAT('%', CAST(:storeName AS string), '%')) " +
        "AND (:productName IS NULL OR LOWER(p.name) LIKE CONCAT('%', CAST(:productName AS string), '%')) " +
        "AND (:city IS NULL OR LOWER(st.city) LIKE CONCAT('%', CAST(:city AS string), '%'))",
        countQuery = "SELECT COUNT(s) FROM Sales s JOIN s.store st JOIN s.product p " +
            "WHERE (:storeId IS NULL OR s.idStore = :storeId) " +
            "AND (:productId IS NULL OR s.idProduct = :productId) " +
            "AND (CAST(:startDate AS date) IS NULL OR CAST(:endDate AS date) IS NULL OR s.rangeDate BETWEEN :startDate AND :endDate) " +
            "AND (:search IS NULL OR " +
                "LOWER(st.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(st.city) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(p.codeBarre) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ") " +
            "AND (:storeName IS NULL OR LOWER(st.name) LIKE CONCAT('%', CAST(:storeName AS string), '%')) " +
            "AND (:productName IS NULL OR LOWER(p.name) LIKE CONCAT('%', CAST(:productName AS string), '%')) " +
            "AND (:city IS NULL OR LOWER(st.city) LIKE CONCAT('%', CAST(:city AS string), '%'))"
    )
    Page<SalesView> findViewsWithFilters(
        @Param("storeId") Long storeId,
        @Param("productId") Long productId,
        @Param("search") String search,
        @Param("storeName") String storeName,
        @Param("productName") String productName,
        @Param("city") String city,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}
