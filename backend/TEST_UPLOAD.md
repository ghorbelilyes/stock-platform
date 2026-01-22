# Test Store Upload with curl

## Step 1: Fix Database Constraint

The database constraint needs to be updated to include STORE. You have two options:

### Option A: Automatic Fix (Recommended)
Restart the backend application. The `DatabaseMigrationListener` will automatically fix the constraint on startup.

### Option B: Manual Fix
Run this SQL command:
```bash
psql -h localhost -U postgres -d store -c "ALTER TABLE file_upload DROP CONSTRAINT IF EXISTS file_upload_file_type_check; ALTER TABLE file_upload ADD CONSTRAINT file_upload_file_type_check CHECK (file_type IN ('STOCK', 'SALES', 'TRANSFER', 'STORE'));"
```

Or use the provided script:
```bash
psql -h localhost -U postgres -d store -f fix_constraint.sql
```

## Step 2: Test Upload

### 1. Parse Headers
```bash
curl -X POST http://localhost:8080/api/files/parse-headers \
  -F "file=@../src/assets/csv_files/user.csv"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "headers": ["name", "city", "type"],
    "rowCount": 5
  }
}
```

### 2. Get Required Columns
```bash
curl -X GET http://localhost:8080/api/files/required-columns/STORE
```

Expected response:
```json
{
  "success": true,
  "data": {
    "fileType": "STORE",
    "requiredColumns": ["name", "city", "type"]
  }
}
```

### 3. Upload File with Column Mapping
```bash
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@../src/assets/csv_files/user.csv" \
  -F "fileType=STORE" \
  -F 'columnMapping={"fileType":"STORE","mappings":[{"fileColumn":"name","backendColumn":"name","required":true},{"fileColumn":"city","backendColumn":"city","required":true},{"fileColumn":"type","backendColumn":"type","required":true}]}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "fileUploadId": 1,
    "fileName": "user.csv",
    "fileType": "STORE",
    "uploadedAt": "2026-01-22T01:30:00",
    "valid": true,
    "rowsProcessed": 5,
    "rowsInserted": 5,
    "rowsFailed": 0,
    "errors": []
  }
}
```

### 4. Verify Stores Were Created
```bash
curl -X GET http://localhost:8080/api/stores
```

Expected response should include the 5 stores from the CSV:
- Store A, New York, store
- Store B, Los Angeles, store
- Warehouse 1, Chicago, warehouse
- Store C, Miami, store
- Warehouse 2, Houston, warehouse

You can also filter by type:
```bash
curl -X GET "http://localhost:8080/api/stores?type=store"
curl -X GET "http://localhost:8080/api/stores?type=warehouse"
```
