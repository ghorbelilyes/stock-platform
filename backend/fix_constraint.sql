-- Fix file_upload_file_type_check constraint to include STORE
-- Run this script against your PostgreSQL database

-- Drop the existing constraint
ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check;

-- Recreate the constraint with STORE and PRODUCT included
ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check 
    CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE', 'PRODUCT'));
