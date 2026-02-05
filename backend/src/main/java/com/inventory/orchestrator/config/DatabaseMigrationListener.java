package com.inventory.orchestrator.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Automatically fixes the file_upload_file_type_check constraint on startup
 * to include STORE and PRODUCT file types.
 */
@Component
@Order(1)
public class DatabaseMigrationListener {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationListener.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @PostConstruct
    public void runMigrations() {
        fixFileTypeConstraint();
        addTransferStatusColumn();
    }

    private void fixFileTypeConstraint() {
        try {
            logger.info("Checking file_upload_file_type_check constraint...");
            jdbcTemplate.execute(
                "ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check"
            );
            jdbcTemplate.execute(
                "ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check " +
                "CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE', 'PRODUCT'))"
            );
            logger.info("Successfully updated file_upload_file_type_check constraint to include STORE and PRODUCT");
        } catch (Exception e) {
            logger.warn("Could not update file_upload_file_type_check constraint: {}", e.getMessage());
        }
    }

    /** Ensures transfer.status column exists (fixes GET /transfers when DB was created before migration 003). */
    private void addTransferStatusColumn() {
        try {
            logger.info("Ensuring transfer.status column exists...");
            jdbcTemplate.execute(
                "ALTER TABLE transfer ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'in_transit'"
            );
            logger.info("Transfer table has status column.");
        } catch (Exception e) {
            logger.warn("Could not add transfer.status column: {}", e.getMessage());
        }
    }
}
