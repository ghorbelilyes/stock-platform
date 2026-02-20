package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.CategorySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategorySettingsRepository extends JpaRepository<CategorySettings, Long> {
    Optional<CategorySettings> findByCategoryId(Long categoryId);
}
