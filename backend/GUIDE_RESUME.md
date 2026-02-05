# Guide Résumé - Inventory Orchestrator Backend

**Quick reference for essential app logic, entity relationships, and data upload flow.**

---

## Entity Relationships

### Complete ER Diagram

```
                    ┌──────────────┐
                    │    Store     │
                    │ - id (PK)    │
                    │ - name       │
                    │ - city       │
                    │ - type       │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼──────┐      ┌─────▼──────┐    ┌─────▼──────┐
   │  Stock    │      │   Sales    │    │  Transfer  │
   │ (PK: store│      │ - id_store │    │ - id_store │
   │  + product)│     │ - id_prod  │    │   _sent    │
   │ - quantity│      │ - quantity │    │ - id_store │
   └─────┬─────┘      └─────┬──────┘    │   _receive │
         │                  │            │ - id_prod  │
         │                  │            │ - status   │ (approved|in_transit|received|closed)
         └──────────────────┼────────────┴─────┬──────┘
                            │                  │
                    ┌───────▼───────┐    ┌─────▼──────┐
                    │   Product     │    │  Category   │
                    │ - id (PK)     │    │ - id (PK)   │
                    │ - codeBarre   │◄───│ - name      │
                    │ - category_id │    │ - desc      │
                    │   (FK)        │    └────────────┘
                    └───────────────┘
```

### Relationship Summary

| Entity | Relationships |
|--------|--------------|
| **Store** | 1→N: Stock, Sales, Transfer (sent), Transfer (receive) |
| **Product** | N→1: Category<br>1→N: Stock, Sales, Transfer |
| **Category** | 1→N: Product |
| **Stock** | N→1: Store, Product<br>**Composite PK:** (id_store, id_product) |
| **Sales** | N→1: Store, Product |
| **Transfer** | N→1: Store (sent), Store (receive), Product |

### Foreign Keys

| Table | Column | References | Type |
|-------|--------|-----------|------|
| stock | id_store | store.id | Many-to-One |
| stock | id_product | product.id | Many-to-One |
| sales | id_store | store.id | Many-to-One |
| sales | id_product | product.id | Many-to-One |
| transfer | id_store_sent | store.id | Many-to-One |
| transfer | id_store_receive | store.id | Many-to-One |
| transfer | id_product | product.id | Many-to-One |
| product | category_id | category.id | Many-to-One |

### Key Points

- **All relationships:** Bidirectional with `mappedBy` on "one" side
- **Lazy loading:** All relationships use `FetchType.LAZY` (except Product→Category which is EAGER)
- **Composite key:** Stock uses `(id_store, id_product)` as primary key
- **FK management:** Foreign keys stored as `Long` fields, relationships use `insertable = false, updatable = false`

### Entity Field Details

**Store:**
- `id` = `serialNumber` parsed as `Long` (similar to Product)
- Fields: `serialNumber`, `name`, `city`, `type` ("store" or "warehouse"), `leadTimeDays`

**Product:**
- `id` = `codeBarre` parsed as `Long`
- Fields: `codeBarre`, `name`, `description`, `category_id` (FK)

**FileUpload:**
- Tracks CSV uploads with validation results
- Fields: `fileName`, `fileType`, `uploadedAt`, `valid`, `errors`, `columnMappingJson`, `rowsProcessed`, `rowsInserted`, `rowsFailed`

---

## Data Upload Flow

### CSV Import Process

```
1. User uploads CSV file
   ↓
2. POST /api/files/parse-headers
   → Extract CSV headers
   → Return headers + row count
   ↓
3. GET /api/files/required-columns/{fileType}
   → Get backend column requirements
   ↓
4. User maps file columns → backend columns (via UI)
   ↓
5. POST /api/files/validate
   → Validate mapping completeness
   → Return validation result
   ↓
6. POST /api/files/upload
   → Create FileUpload record
   → Parse CSV rows
   → Transform each row using column mapping
   → Validate each row (data types, business rules)
   → Batch insert valid rows
   → Update FileUpload with statistics
   ↓
7. Return ImportResult (rows processed, inserted, failed)
```

### Required Backend Columns

| File Type | Required Columns |
|----------|----------------|
| **STOCK** | `id_store`, `id_product`, `quantity` |
| **SALES** | `id_store`, `id_product`, `quantity`, `range_date` |
| **TRANSFER** | `date`, `id_store_sent`, `id_store_receive`, `id_product`, `reason`, `quantity` |

### Column Mapping Logic

1. **User uploads CSV** with custom column names (e.g., "Store ID", "Product ID", "Qty")
2. **System extracts headers** from first CSV row
3. **User maps** file columns → backend columns via UI
4. **Service transforms** each row: `ColumnMappingService.transformRow(csvRow, mappingConfig)`
5. **Data validated** and imported

**Example Mapping:**
```
File Columns          →  Backend Columns
"Store ID"           →  id_store
"Product ID"         →  id_product
"Qty"                →  quantity
"Sale Date"          →  range_date
```

### Business Rules

- **Stock:** `quantity >= 0`, product must exist
- **Sales:** `quantity > 0`, product must exist, date required
- **Transfer:** `quantity > 0`, product must exist, `sender ≠ receiver`

### Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **CsvProcessingService** | Parse CSV files | `parseHeaders()`, `processCsvFile()` |
| **ColumnMappingService** | Transform CSV columns | `transformRow()`, `validateMapping()` |
| **DataImportService** | Import data to DB | `importStockData()`, `importSalesData()`, `importTransferData()` |
| **TransferSuggestionService** | Transfer suggestions from stock | `getSuggestions()`, `approveSuggestion(suggestionId, quantity)` |

---

## API Structure

### Base URL
```
http://localhost:8080/api
```

### Main Controllers

| Controller | Endpoints | Purpose |
|------------|-----------|---------|
| **FileController** | `/files/*` | CSV upload, parsing, validation |
| **StoreController** | `/stores` | Store queries (pagination, search, filter) |
| **ProductController** | `/products` | Product CRUD, search, filter by category |
| **CategoryController** | `/categories` | Category CRUD, manage products in category |
| **StockController** | `/stocks` | Stock queries (filter by store/product) |
| **SalesController** | `/sales` | Sales queries (filter by store/product/date) |
| **TransferController** | `/transfers` | Transfer queries (filter by stores/product/date); `GET /suggestions`, `POST /suggestions/approve` (transfer suggestions) |

### Key Category Endpoints

- `GET /categories` - List categories (pagination, search, filter)
- `GET /categories/{id}` - Get category by ID
- `POST /categories` - Create category
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Delete category
- `GET /categories/{id}/products` - Get products in category
- `POST /categories/{id}/products` - Add products to category
- `DELETE /categories/{id}/products/{productId}` - Remove product from category
- `GET /categories/products-without-category` - Get products without category

### Response Format

All endpoints return `ApiResponse<T>`:
```json
{
  "success": boolean,
  "data": T,
  "message": string,
  "error": {
    "code": string,
    "message": string,
    "details": string[]
  }
}
```

---

## Key Implementation Details

### ID Strategies
- **Product:** `id` equals `codeBarre` parsed as `Long`
  - Example: `codeBarre = "1234567890123"` → `id = 1234567890123L`
- **Store:** `id` equals `serialNumber` parsed as `Long`
  - Example: `serialNumber = "1001"` → `id = 1001L`

### DTO Views (Hibernate Proxy Avoidance)
- **StockView** - Used in StockController to avoid proxy serialization issues
- **SalesView** - Used in SalesController to avoid proxy serialization issues
- These DTOs project only needed fields, preventing `LazyInitializationException` and proxy serialization errors

### Stock Composite Key
- Primary key: `(id_store, id_product)`
- Implemented via `@IdClass(StockId.class)`
- Ensures unique stock entry per store-product combination

### Transfer Status & Suggestions
- **Transfer.status**: `approved` | `in_transit` | `received` | `closed`. Migration `003_add_transfer_status.sql`. New transfers from approved suggestions get `in_transit`.
- **Transfer suggestions**: `GET /transfers/suggestions` returns computed suggestions (donor stores with excess → receiver stores with low/zero stock). `POST /transfers/suggestions/approve` body: `{ "suggestionId": "fromStoreId-toStoreId-productId", "quantity"?: number }` creates the transfer.

### Lazy Loading
- All relationships use `FetchType.LAZY` except `Product.category` (EAGER)
- Access lazy relationships inside transaction or use `@EntityGraph` / `JOIN FETCH`

### Transactions
- `@Transactional` on `DataImportService` import methods
- Ensures atomicity: all rows imported or none
- Batch inserts for performance (`hibernate.jdbc.batch_size=50`)

---

## Quick Reference

### Adding New Entity
1. Create entity with `@Entity`, `@Table`
2. Add relationships with `@ManyToOne` / `@OneToMany`
3. Create repository extending `JpaRepository`
4. Create controller with endpoints

### Modifying Relationships
1. Update both entity classes (bidirectional)
2. Update `mappedBy` attribute if needed
3. Ensure foreign key columns exist in DB

### CSV Import Checklist
1. Parse headers → `CsvProcessingService.parseHeaders()`
2. Get required columns → `ColumnMappingService.getRequiredColumns()`
3. User creates mapping
4. Validate → `ColumnMappingService.validateMapping()`
5. Upload → `DataImportService.importXxxData()`
6. Transform rows → `ColumnMappingService.transformRow()`
7. Validate & insert → Repository batch save

---

**Last Updated:** 2026-02-05  
**Version:** 1.1.0
