# Fix Database Constraint for STORE and PRODUCT File Types

## Problem
The database has a check constraint `file_upload_file_type_check` that doesn't include `STORE` or `PRODUCT` as valid values. This causes uploads to fail with:
```
violates check constraint "file_upload_file_type_check"
```

## Solution

### Option 1: Automatic Fix (Recommended)
**Restart the backend application.** The `DatabaseMigrationListener` will automatically fix the constraint on startup to include both STORE and PRODUCT.

### Option 2: Using psql (Manual)
```bash
cd backend
psql -h localhost -U postgres -d store -f fix_constraint.sql
```

Or manually:
```sql
ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check;
ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check 
    CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE', 'PRODUCT'));
```

### Option 3: Using Docker
If you're using Docker Compose:
```bash
cd backend
docker-compose exec db psql -U postgres -d store -c "ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check;"
docker-compose exec db psql -U postgres -d store -c "ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE', 'PRODUCT'));"
```

### Option 4: Using pgAdmin or any PostgreSQL client
Run the SQL commands from `fix_constraint.sql` in your PostgreSQL client.

## Verify Fix
After running the fix, test the upload:
```bash
# Test STORE upload
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@../src/assets/csv_files/user.csv" \
  -F "fileType=STORE" \
  -F 'columnMapping={"fileType":"STORE","mappings":[{"fileColumn":"serial_number","backendColumn":"serial_number","required":true},{"fileColumn":"name","backendColumn":"name","required":true},{"fileColumn":"city","backendColumn":"city","required":true},{"fileColumn":"type","backendColumn":"type","required":true}]}'

# Test PRODUCT upload
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@../src/assets/csv_files/products.csv" \
  -F "fileType=PRODUCT" \
  -F 'columnMapping={"fileType":"PRODUCT","mappings":[{"fileColumn":"code_barre","backendColumn":"code_barre","required":true},{"fileColumn":"name","backendColumn":"name","required":true},{"fileColumn":"description","backendColumn":"description","required":true}]}'
```
