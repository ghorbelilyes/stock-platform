package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    Optional<Category> findByName(String name);
    
    // Search categories by name or description (case-insensitive)
    @Query("SELECT c FROM Category c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Category> searchCategories(@Param("search") String search, Pageable pageable);
    
    // Filter by name
    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Filter by description
    Page<Category> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);
}
