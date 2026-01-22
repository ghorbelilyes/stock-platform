package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    java.util.Optional<Product> findByCodeBarre(String codeBarre);
}
