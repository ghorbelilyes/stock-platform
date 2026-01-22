package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Stock;
import com.inventory.orchestrator.entity.StockId;
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
}
