-- Change DATE columns to TIMESTAMP for sales and transfers
-- This allows more precise tracking of when sales and transfers occurred

-- Update sales.range_date from DATE to TIMESTAMP
ALTER TABLE sales 
ALTER COLUMN range_date TYPE TIMESTAMP USING range_date::TIMESTAMP;

-- Update transfer.date from DATE to TIMESTAMP
ALTER TABLE transfer 
ALTER COLUMN date TYPE TIMESTAMP USING date::TIMESTAMP;

COMMENT ON COLUMN sales.range_date IS 'Timestamp when the sale occurred';
COMMENT ON COLUMN transfer.date IS 'Timestamp when the transfer was initiated';
