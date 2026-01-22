-- Database initialization script
-- This script is executed automatically when PostgreSQL container starts

-- Create database (if not exists)
-- Note: PostgreSQL doesn't support CREATE DATABASE IF NOT EXISTS
-- So we'll create it manually or it will be created by Docker

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables will be created automatically by Hibernate
-- when spring.jpa.hibernate.ddl-auto=update is set
-- This script is mainly for reference and any manual setup

-- Example: Create indexes (optional, can be done after tables are created)
-- CREATE INDEX IF NOT EXISTS idx_stock_store_product ON stock(id_store, id_product);
-- CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(id_store, range_date);
-- CREATE INDEX IF NOT EXISTS idx_transfer_dates ON transfer(date);
