package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    java.util.Optional<Product> findByCodeBarre(String codeBarre);
    
    // Search products by name, codeBarre, or description (case-insensitive)
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.codeBarre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
    
    // Filter by name
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Filter by codeBarre
    Page<Product> findByCodeBarreContainingIgnoreCase(String codeBarre, Pageable pageable);
    
    // Filter by description
    Page<Product> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);
}
