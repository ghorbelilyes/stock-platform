-- Add column to category table to control store-to-store transfer restrictions
-- If allow_store_to_store_transfer = false, only warehouse → store transfers are allowed
-- Default is true (allow all transfers) for backward compatibility

ALTER TABLE category 
ADD COLUMN IF NOT EXISTS allow_store_to_store_transfer BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN category.allow_store_to_store_transfer IS 
'If false, only allows transfers from warehouse to store. Blocks store-to-store, warehouse-to-warehouse, and store-to-warehouse transfers for products in this category.';
