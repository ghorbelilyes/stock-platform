package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.TransferSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferSuggestionRepository extends JpaRepository<TransferSuggestion, Long> {
    
    List<TransferSuggestion> findByFromStoreId(Long fromStoreId);
    
    List<TransferSuggestion> findByToStoreId(Long toStoreId);
    
    List<TransferSuggestion> findByProductId(Long productId);
    
    List<TransferSuggestion> findByFromStoreIdAndToStoreIdAndProductId(
        Long fromStoreId, Long toStoreId, Long productId
    );
    
    Optional<TransferSuggestion> findByFromStoreIdAndToStoreIdAndProductIdAndCreatedAt(
        Long fromStoreId, Long toStoreId, Long productId, java.time.LocalDateTime createdAt
    );
}
