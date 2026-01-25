# API Usage Examples

This document provides practical examples for using the Inventory Orchestrator API.

## Base URL

```
http://localhost:8080/api
```

## File Upload & Column Mapping

### 1. Parse CSV Headers

**Request:**
```bash
curl -X POST http://localhost:8080/api/files/parse-headers \
  -F "file=@stock.csv"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "headers": ["Store ID", "Product ID", "Quantity"],
    "rowCount": 150
  },
  "message": "Headers parsed successfully"
}
```

### 2. Get Required Columns

**Request:**
```bash
curl http://localhost:8080/api/files/required-columns/STOCK
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileType": "STOCK",
    "requiredColumns": ["id_store", "id_product", "quantity"]
  },
  "message": "Required columns retrieved successfully"
}
```

### 3. Upload File with Column Mapping

**Request:**
```bash
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@stock.csv" \
  -F "fileType=STOCK" \
  -F 'columnMapping={"fileType":"STOCK","mappings":[{"fileColumn":"Store ID","backendColumn":"id_store","required":true},{"fileColumn":"Product ID","backendColumn":"id_product","required":true},{"fileColumn":"Quantity","backendColumn":"quantity","required":true}]}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUploadId": 1,
    "fileName": "stock.csv",
    "fileType": "STOCK",
    "uploadedAt": "2024-01-21T23:00:00",
    "valid": true,
    "rowsProcessed": 150,
    "rowsInserted": 148,
    "rowsFailed": 2,
    "errors": [
      "Row 45: Product ID 999 does not exist",
      "Row 78: Quantity cannot be negative"
    ]
  },
  "message": "File uploaded and processed successfully"
}
```

## Data Retrieval

### 1. Get All Products

**Request:**
```bash
curl http://localhost:8080/api/products
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product A",
      "description": "Description of Product A"
    },
    {
      "id": 2,
      "name": "Product B",
      "description": "Description of Product B"
    }
  ],
  "message": "Products retrieved successfully"
}
```

### 2. Get Product by ID

**Request:**
```bash
curl http://localhost:8080/api/products/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product A",
    "description": "Description of Product A"
  },
  "message": "Product retrieved successfully"
}
```

### 3. Get Stocks with Filters

**Request:**
```bash
# Get all stocks
curl http://localhost:8080/api/stocks

# Get stocks for a specific store
curl "http://localhost:8080/api/stocks?storeId=1"

# Get stocks for a specific product
curl "http://localhost:8080/api/stocks?productId=5"

# Get stocks with pagination
curl "http://localhost:8080/api/stocks?page=0&size=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "idStore": 1,
        "idProduct": 5,
        "quantity": 100
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 20,
    "number": 0
  },
  "message": "Stocks retrieved successfully"
}
```

### 4. Get Sales with Date Range

**Request:**
```bash
curl "http://localhost:8080/api/sales?startDate=2024-01-01&endDate=2024-12-31&page=0&size=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "rangeDate": "2024-01-15",
        "idStore": 1,
        "idProduct": 5,
        "quantity": 10
      }
    ],
    "totalElements": 1,
    "totalPages": 1
  },
  "message": "Sales retrieved successfully"
}
```

### 5. Get Transfers

**Request:**
```bash
# Get all transfers
curl http://localhost:8080/api/transfers

# Get transfers for a store (as sender)
curl "http://localhost:8080/api/transfers?storeSent=1"

# Get transfers for a store (as receiver)
curl "http://localhost:8080/api/transfers?storeReceive=2"

# Get transfers for a product
curl "http://localhost:8080/api/transfers?productId=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2024-01-20",
      "idStoreSent": 1,
      "idStoreReceive": 2,
      "idProduct": 5,
      "reason": "Low stock at destination",
      "quantity": 50
    }
  ],
  "message": "Transfers retrieved successfully"
}
```

## Error Responses

### Validation Error

**Response:**
```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File validation failed",
    "details": [
      "Row 5: Required column 'id_product' is missing",
      "Row 12: Invalid quantity value"
    ]
  }
}
```

### File Too Large

**Response:**
```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed size",
    "details": []
  }
}
```

## Postman Collection

You can import these examples into Postman:

1. Create a new collection: "Inventory Orchestrator API"
2. Set base URL variable: `{{baseUrl}} = http://localhost:8080/api`
3. Add requests for each endpoint
4. Use environment variables for different environments

## JavaScript/Fetch Examples

### Parse Headers

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8080/api/files/parse-headers', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Get Products

```javascript
fetch('http://localhost:8080/api/products')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Products:', data.data);
    }
  });
```

### Upload File with Mapping

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fileType', 'STOCK');
formData.append('columnMapping', JSON.stringify({
  fileType: 'STOCK',
  mappings: [
    { fileColumn: 'Store ID', backendColumn: 'id_store', required: true },
    { fileColumn: 'Product ID', backendColumn: 'id_product', required: true },
    { fileColumn: 'Quantity', backendColumn: 'quantity', required: true }
  ]
}));

fetch('http://localhost:8080/api/files/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Upload successful:', data.data);
  } else {
    console.error('Upload failed:', data.error);
  }
});
```

## Python Examples

### Using requests library

```python
import requests

# Get products
response = requests.get('http://localhost:8080/api/products')
data = response.json()
print(data['data'])

# Upload file
files = {'file': open('stock.csv', 'rb')}
data = {
    'fileType': 'STOCK',
    'columnMapping': '{"fileType":"STOCK","mappings":[...]}'
}
response = requests.post('http://localhost:8080/api/files/upload', files=files, data=data)
print(response.json())
```
