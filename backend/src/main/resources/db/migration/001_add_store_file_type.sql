-- Migration script to add STORE to file_upload_file_type_check constraint
-- This fixes the constraint that was created before STORE was added to FileType enum

-- Drop the existing constraint if it exists
ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check;

-- Recreate the constraint with STORE included
ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check 
    CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE'));
