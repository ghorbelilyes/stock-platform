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
    public void fixFileTypeConstraint() {
        try {
            logger.info("Checking file_upload_file_type_check constraint...");
            
            // Drop existing constraint if it exists
            jdbcTemplate.execute(
                "ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check"
            );
            
            // Recreate constraint with STORE and PRODUCT included
            jdbcTemplate.execute(
                "ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check " +
                "CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE', 'PRODUCT'))"
            );
            
            logger.info("Successfully updated file_upload_file_type_check constraint to include STORE and PRODUCT");
        } catch (Exception e) {
            // Log but don't fail startup if constraint doesn't exist or table doesn't exist yet
            logger.warn("Could not update file_upload_file_type_check constraint: {}", e.getMessage());
            logger.debug("This is normal if the table doesn't exist yet or constraint is already correct", e);
        }
    }
}
