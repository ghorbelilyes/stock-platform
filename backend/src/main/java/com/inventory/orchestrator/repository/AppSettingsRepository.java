package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppSettingsRepository extends JpaRepository<AppSettings, String> {
    Optional<AppSettings> findByKey(String key);
}
