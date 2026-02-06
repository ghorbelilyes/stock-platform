package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.dto.StockView;
import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.entity.StockId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockRepository extends JpaRepository<Stock, StockId> {
    
    List<Stock> findByIdStore(Long idStore);
    
    List<Stock> findByIdProduct(Long idProduct);
    
    @Query("SELECT s FROM Stock s WHERE s.idStore = :storeId AND s.idProduct = :productId")
    Stock findByIdStoreAndIdProduct(@Param("storeId") Long idStore, @Param("productId") Long idProduct);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.StockView(" +
            "s.idStore, s.idProduct, s.quantity, s.suggestionQuantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Stock s JOIN s.store st JOIN s.product p",
        countQuery = "SELECT COUNT(s) FROM Stock s"
    )
    Page<StockView> findAllViews(Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.StockView(" +
            "s.idStore, s.idProduct, s.quantity, s.suggestionQuantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Stock s JOIN s.store st JOIN s.product p " +
        "WHERE s.idStore = :storeId",
        countQuery = "SELECT COUNT(s) FROM Stock s WHERE s.idStore = :storeId"
    )
    Page<StockView> findByIdStoreView(@Param("storeId") Long storeId, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.StockView(" +
            "s.idStore, s.idProduct, s.quantity, s.suggestionQuantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Stock s JOIN s.store st JOIN s.product p " +
        "WHERE s.idProduct = :productId",
        countQuery = "SELECT COUNT(s) FROM Stock s WHERE s.idProduct = :productId"
    )
    Page<StockView> findByIdProductView(@Param("productId") Long productId, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.StockView(" +
            "s.idStore, s.idProduct, s.quantity, s.suggestionQuantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Stock s JOIN s.store st JOIN s.product p " +
        "WHERE s.idStore = :storeId AND s.idProduct = :productId",
        countQuery = "SELECT COUNT(s) FROM Stock s WHERE s.idStore = :storeId AND s.idProduct = :productId"
    )
    Page<StockView> findByIdStoreAndIdProductView(@Param("storeId") Long storeId, @Param("productId") Long productId, Pageable pageable);

    @Query(
        value = "SELECT new com.inventory.orchestrator.dto.StockView(" +
            "s.idStore, s.idProduct, s.quantity, s.suggestionQuantity, " +
            "st.id, st.serialNumber, st.name, st.city, st.type, st.leadTimeDays, " +
            "p.id, p.codeBarre, p.name, p.description" +
        ") " +
        "FROM Stock s JOIN s.store st JOIN s.product p " +
        "WHERE (:storeId IS NULL OR s.idStore = :storeId) " +
        "AND (:productId IS NULL OR s.idProduct = :productId) " +
        "AND (:search IS NULL OR " +
            "LOWER(st.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(st.city) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(st.type) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
            "LOWER(p.codeBarre) LIKE CONCAT('%', CAST(:search AS string), '%')" +
        ") " +
        "AND (:storeName IS NULL OR LOWER(st.name) LIKE CONCAT('%', CAST(:storeName AS string), '%')) " +
        "AND (:productName IS NULL OR LOWER(p.name) LIKE CONCAT('%', CAST(:productName AS string), '%')) " +
        "AND (:city IS NULL OR LOWER(st.city) LIKE CONCAT('%', CAST(:city AS string), '%')) " +
        "AND (:type IS NULL OR LOWER(st.type) LIKE CONCAT('%', CAST(:type AS string), '%'))",
        countQuery = "SELECT COUNT(s) FROM Stock s JOIN s.store st JOIN s.product p " +
            "WHERE (:storeId IS NULL OR s.idStore = :storeId) " +
            "AND (:productId IS NULL OR s.idProduct = :productId) " +
            "AND (:search IS NULL OR " +
                "LOWER(st.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(st.city) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(st.type) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(p.name) LIKE CONCAT('%', CAST(:search AS string), '%') OR " +
                "LOWER(p.codeBarre) LIKE CONCAT('%', CAST(:search AS string), '%')" +
            ") " +
            "AND (:storeName IS NULL OR LOWER(st.name) LIKE CONCAT('%', CAST(:storeName AS string), '%')) " +
            "AND (:productName IS NULL OR LOWER(p.name) LIKE CONCAT('%', CAST(:productName AS string), '%')) " +
            "AND (:city IS NULL OR LOWER(st.city) LIKE CONCAT('%', CAST(:city AS string), '%')) " +
            "AND (:type IS NULL OR LOWER(st.type) LIKE CONCAT('%', CAST(:type AS string), '%'))"
    )
    Page<StockView> findViewsWithFilters(
        @Param("storeId") Long storeId,
        @Param("productId") Long productId,
        @Param("search") String search,
        @Param("storeName") String storeName,
        @Param("productName") String productName,
        @Param("city") String city,
        @Param("type") String type,
        Pageable pageable
    );
}
