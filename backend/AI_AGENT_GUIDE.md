# AI Agent Guide - Intelligent Inventory Orchestrator Backend

**Purpose:** This document provides complete technical information about the backend architecture, relationships, and implementation details for AI agents working on this codebase.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema & Relationships](#database-schema--relationships)
3. [Entity Models](#entity-models)
4. [API Structure](#api-structure)
5. [Service Layer Logic](#service-layer-logic)
6. [Data Flow](#data-flow)
7. [Key Concepts](#key-concepts)
8. [File Structure](#file-structure)
9. [Common Patterns](#common-patterns)

---

## Architecture Overview

### Technology Stack
- **Framework:** Spring Boot 3.5.0
- **Language:** Java 25
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven

### Application Layers

```
┌─────────────────────────────────────────┐
│         Controller Layer                 │
│  (REST Endpoints, Request/Response)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Service Layer                    │
│  (Business Logic, Data Processing)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Repository Layer                │
│  (Database Access, JPA Queries)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Entity Layer                    │
│  (Database Models, Relationships)        │
└─────────────────────────────────────────┘
```

### Package Structure
```
com.inventory.orchestrator/
├── entity/          # JPA entities (database models)
├── repository/      # JPA repositories (data access)
├── service/         # Business logic services
├── controller/      # REST API controllers
├── dto/             # Data Transfer Objects (API contracts)
├── config/          # Configuration classes
├── exception/       # Exception handlers
└── InventoryOrchestratorApplication.java
```

---

## Database Schema & Relationships

### Complete Entity Relationship Diagram

```
                    ┌──────────────┐
                    │    Store     │
                    │              │
                    │ - id (PK)    │
                    │ - name       │
                    │ - city       │
                    │ - type       │
                    │ - leadTime   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼──────┐      ┌─────▼──────┐    ┌─────▼──────┐
   │  Stock    │      │   Sales    │    │  Transfer  │
   │           │      │            │    │            │
   │ - id_store│      │ - id_store │    │ - id_store │
   │   (FK)    │      │   (FK)     │    │   _sent    │
   │ - id_prod │      │ - id_prod  │    │   (FK)     │
   │   (FK)    │      │   (FK)     │    │ - id_store │
   │ - quantity│      │ - quantity │    │   _receive │
   │           │      │ - rangeDate│    │   (FK)     │
   │ (PK: store│      │            │    │ - id_prod  │
   │  + product)│     │            │    │   (FK)     │
   └─────┬─────┘      └─────┬──────┘    └─────┬──────┘
         │                  │                  │
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                    ┌───────▼───────┐
                    │   Product     │
                    │               │
                    │ - id (PK)     │
                    │ - name        │
                    │ - description │
                    └───────────────┘
```

### Relationship Details

#### Store Entity Relationships
- **One-to-Many with Stock:** `Store 1 ──< Stock` (one store has many stock entries)
  - Mapping: `@OneToMany(mappedBy = "store")` in Store
  - Foreign Key: `Stock.id_store → Store.id`
  
- **One-to-Many with Sales:** `Store 1 ──< Sales` (one store has many sales)
  - Mapping: `@OneToMany(mappedBy = "store")` in Store
  - Foreign Key: `Sales.id_store → Store.id`
  
- **One-to-Many with Transfer (as sender):** `Store 1 ──< Transfer` (storeSent)
  - Mapping: `@OneToMany(mappedBy = "storeSent")` in Store
  - Foreign Key: `Transfer.id_store_sent → Store.id`
  
- **One-to-Many with Transfer (as receiver):** `Store 1 ──< Transfer` (storeReceive)
  - Mapping: `@OneToMany(mappedBy = "storeReceive")` in Store
  - Foreign Key: `Transfer.id_store_receive → Store.id`

#### Product Entity Relationships
- **One-to-Many with Stock:** `Product 1 ──< Stock` (one product in many stores)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Stock.id_product → Product.id`
  
- **One-to-Many with Sales:** `Product 1 ──< Sales` (one product has many sales)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Sales.id_product → Product.id`
  
- **One-to-Many with Transfer:** `Product 1 ──< Transfer` (one product transferred many times)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Transfer.id_product → Product.id`

#### Stock Entity Relationships
- **Many-to-One with Store:** `Stock >── 1 Store` (many stocks belong to one store)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store")` in Stock
  - Composite Primary Key: `(id_store, id_product)`
  
- **Many-to-One with Product:** `Stock >── 1 Product` (many stocks for one product)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Stock

#### Sales Entity Relationships
- **Many-to-One with Store:** `Sales >── 1 Store`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store")` in Sales
  
- **Many-to-One with Product:** `Sales >── 1 Product`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Sales

#### Transfer Entity Relationships
- **Many-to-One with Store (sender):** `Transfer >── 1 Store` (storeSent)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store_sent")` in Transfer
  
- **Many-to-One with Store (receiver):** `Transfer >── 1 Store` (storeReceive)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store_receive")` in Transfer
  
- **Many-to-One with Product:** `Transfer >── 1 Product`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Transfer

### Foreign Key Constraints

| Table    | Column          | References      | Relationship Type |
|----------|----------------|-----------------|-------------------|
| stock    | id_store       | store.id        | Many-to-One       |
| stock    | id_product     | product.id      | Many-to-One       |
| sales    | id_store       | store.id        | Many-to-One       |
| sales    | id_product     | product.id      | Many-to-One       |
| transfer | id_store_sent  | store.id        | Many-to-One       |
| transfer | id_store_receive| store.id       | Many-to-One       |
| transfer | id_product     | product.id      | Many-to-One       |

### Important Notes on Relationships

1. **Bidirectional Relationships:** All relationships are bidirectional with `mappedBy` on the "one" side
2. **Lazy Loading:** All `@ManyToOne` and `@OneToMany` use `FetchType.LAZY` for performance
3. **Join Columns:** Use `insertable = false, updatable = false` because foreign keys are managed directly via `id_store`, `id_product` fields
4. **Composite Key:** Stock uses composite primary key `(id_store, id_product)` via `@IdClass(StockId.class)`

---

## Entity Models

### Store Entity
```java
@Entity
@Table(name = "store")
public class Store {
    @Id @GeneratedValue
    private Long id;
    private String name;
    private String city;
    private String type;  // "store" or "warehouse"
    private Integer leadTimeDays;
    
    @OneToMany(mappedBy = "store")
    private List<Stock> stocks;
    
    @OneToMany(mappedBy = "store")
    private List<Sales> sales;
    
    @OneToMany(mappedBy = "storeSent")
    private List<Transfer> transfersSent;
    
    @OneToMany(mappedBy = "storeReceive")
    private List<Transfer> transfersReceived;
}
```

**Purpose:** Represents physical stores or warehouses in the inventory system.

### Product Entity
```java
@Entity
@Table(name = "product")
public class Product {
    @Id @GeneratedValue
    private Long id;
    private String name;
    private String description;
    
    @OneToMany(mappedBy = "product")
    private List<Stock> stocks;
    
    @OneToMany(mappedBy = "product")
    private List<Sales> sales;
    
    @OneToMany(mappedBy = "product")
    private List<Transfer> transfers;
}
```

**Purpose:** Product catalog - items that can be stocked, sold, or transferred.

### Stock Entity
```java
@Entity
@Table(name = "stock")
@IdClass(StockId.class)
public class Stock {
    @Id
    @Column(name = "id_store")
    private Long idStore;  // FK to Store
    
    @Id
    @Column(name = "id_product")
    private Long idProduct;  // FK to Product
    
    private Integer quantity;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    private Product product;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_store", insertable = false, updatable = false)
    private Store store;
}
```

**Purpose:** Current stock levels for each product at each store. Uses composite primary key.

### Sales Entity
```java
@Entity
@Table(name = "sales")
public class Sales {
    @Id @GeneratedValue
    private Long id;
    private LocalDate rangeDate;
    private Long idStore;      // FK to Store
    private Long idProduct;    // FK to Product
    private Integer quantity;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_store", insertable = false, updatable = false)
    private Store store;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    private Product product;
}
```

**Purpose:** Historical sales records with date, store, product, and quantity.

### Transfer Entity
```java
@Entity
@Table(name = "transfer")
public class Transfer {
    @Id @GeneratedValue
    private Long id;
    private LocalDate date;
    private Long idStoreSent;      // FK to Store (sender)
    private Long idStoreReceive;   // FK to Store (receiver)
    private Long idProduct;        // FK to Product
    private String reason;
    private Integer quantity;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_store_sent", insertable = false, updatable = false)
    private Store storeSent;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_store_receive", insertable = false, updatable = false)
    private Store storeReceive;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    private Product product;
}
```

**Purpose:** Records of product transfers between stores, including reason and date.

### FileUpload Entity
```java
@Entity
@Table(name = "file_upload")
public class FileUpload {
    @Id @GeneratedValue
    private Long id;
    private String fileName;
    private FileType fileType;  // STOCK, SALES, TRANSFER
    private LocalDateTime uploadedAt;
    private Boolean valid;
    private List<String> errors;
    private String columnMappingJson;  // Stores mapping configuration
    private Integer rowsProcessed;
    private Integer rowsInserted;
    private Integer rowsFailed;
}
```

**Purpose:** Tracks CSV file uploads, validation results, and import statistics.

---

## API Structure

### Base URL
```
http://localhost:8080/api
```

### Controllers Overview

#### FileController (`/api/files`)
**Purpose:** Handles CSV file upload, parsing, validation, and column mapping.

**Endpoints:**
- `POST /parse-headers` - Extract CSV headers
- `GET /required-columns/{fileType}` - Get backend column requirements
- `POST /validate` - Validate file with column mapping
- `POST /upload` - Upload and import CSV file

**Key DTOs:**
- `ParseHeadersResponse` - Headers and row count
- `RequiredColumnsResponse` - Required backend columns
- `ValidationResult` - Validation status and errors
- `ImportResult` - Import statistics and results
- `FileMappingConfigDTO` - Column mapping configuration
- `ColumnMappingDTO` - Individual column mapping

#### ProductController (`/api/products`)
**Purpose:** Product catalog management.

**Endpoints:**
- `GET /` - Get all products
- `GET /{id}` - Get product by ID

#### StockController (`/api/stocks`)
**Purpose:** Stock level queries.

**Endpoints:**
- `GET /` - Get stocks with filters (storeId, productId, pagination)

#### SalesController (`/api/sales`)
**Purpose:** Sales data queries.

**Endpoints:**
- `GET /` - Get sales with filters (storeId, productId, dateRange, pagination)

#### TransferController (`/api/transfers`)
**Purpose:** Transfer records queries.

**Endpoints:**
- `GET /` - Get transfers with filters (storeSent, storeReceive, productId, dateRange)

### API Response Format

All endpoints return `ApiResponse<T>`:

```java
{
  "success": boolean,
  "data": T,              // Response data (varies by endpoint)
  "message": string,       // Human-readable message
  "error": {               // Only present if success = false
    "code": string,
    "message": string,
    "details": string[]
  }
}
```

---

## Service Layer Logic

### CsvProcessingService
**Purpose:** CSV file parsing and validation.

**Key Methods:**
- `parseHeaders(MultipartFile)` - Extract CSV headers
- `getRowCount(MultipartFile)` - Count data rows
- `processCsvFile(MultipartFile)` - Parse CSV into Map<String, String>
- `validateCsvData(file, mapping, fileType)` - Validate against mapping

**Dependencies:** Apache Commons CSV

### ColumnMappingService
**Purpose:** Transform CSV columns to backend columns.

**Key Methods:**
- `getRequiredColumns(FileType)` - Get required backend columns
- `transformRow(csvRow, mappingConfig)` - Map file columns to backend columns
- `validateMapping(mappingConfig, fileHeaders)` - Validate mapping completeness

**Column Mapping Logic:**
1. User uploads CSV with custom column names
2. System extracts headers from CSV
3. User maps file columns to backend columns via UI
4. Service transforms each row using mapping
5. Data is validated and imported

**Backend Column Requirements:**
- **STOCK:** `id_store`, `id_product`, `quantity`
- **SALES:** `id_store`, `id_product`, `quantity`, `range_date`
- **TRANSFER:** `date`, `id_store_sent`, `id_store_receive`, `id_product`, `reason`, `quantity`

### DataImportService
**Purpose:** Import validated CSV data into database.

**Key Methods:**
- `importStockData(file, mappingConfig)` - Import stock records
- `importSalesData(file, mappingConfig)` - Import sales records
- `importTransferData(file, mappingConfig)` - Import transfer records

**Import Process:**
1. Create `FileUpload` record
2. Parse CSV using `CsvProcessingService`
3. Transform rows using `ColumnMappingService`
4. Validate each row (required fields, data types, business rules)
5. Batch insert valid records
6. Update `FileUpload` with results

**Business Rules:**
- Stock: quantity >= 0, product must exist
- Sales: quantity > 0, product must exist, date required
- Transfer: quantity > 0, product must exist, sender ≠ receiver

---

## Data Flow

### File Upload Flow

```
1. User selects CSV file
   ↓
2. FileController.parseHeaders()
   → CsvProcessingService.parseHeaders()
   → Returns headers + row count
   ↓
3. Frontend displays headers
   ↓
4. User maps columns (file → backend)
   ↓
5. FileController.upload()
   → DataImportService.importXxxData()
   → CsvProcessingService.processCsvFile()
   → ColumnMappingService.transformRow() (for each row)
   → Validate row
   → Batch insert valid rows
   → Update FileUpload record
   ↓
6. Return ImportResult with statistics
```

### Data Query Flow

```
1. Controller receives request
   ↓
2. Extract query parameters (filters, pagination)
   ↓
3. Repository query (with filters)
   ↓
4. Return paginated/filtered results
   ↓
5. Wrap in ApiResponse
   ↓
6. Return JSON response
```

---

## Key Concepts

### Column Mapping System

**Problem:** CSV files may have different column names than backend expects.

**Solution:** Dynamic column mapping where users map file columns to backend columns.

**Example:**
```
File Columns:        Backend Columns:
- "Store ID"    →    id_store
- "Product ID"  →    id_product
- "Qty"         →    quantity
```

**Implementation:**
- `FileMappingConfigDTO` contains list of `ColumnMappingDTO`
- Each mapping has: `fileColumn`, `backendColumn`, `required`
- `ColumnMappingService.transformRow()` applies mapping
- Mapping stored in `FileUpload.columnMappingJson` for audit

### Composite Primary Key

**Stock Entity** uses composite key `(id_store, id_product)`:
- Implemented via `@IdClass(StockId.class)`
- `StockId` is a separate class with `idStore` and `idProduct`
- Both fields marked with `@Id` in `Stock` entity
- Ensures unique stock entry per store-product combination

### Lazy Loading Strategy

All relationships use `FetchType.LAZY`:
- **Performance:** Avoids loading unnecessary data
- **N+1 Problem:** Use `@EntityGraph` or `JOIN FETCH` when needed
- **Access:** Accessing lazy relationships outside transaction causes `LazyInitializationException`

### Transaction Management

- `@Transactional` on `DataImportService` import methods
- Ensures atomicity: all rows imported or none
- Batch inserts for performance

---

## File Structure

### Entity Files
```
entity/
├── Store.java          # Store/warehouse entity
├── Product.java        # Product catalog
├── Stock.java          # Stock levels (composite key)
├── StockId.java        # Composite key class
├── Sales.java          # Sales records
├── Transfer.java       # Transfer records
├── FileUpload.java     # Upload tracking
└── FileType.java       # Enum: STOCK, SALES, TRANSFER
```

### Repository Files
```
repository/
├── StoreRepository.java
├── ProductRepository.java
├── StockRepository.java
├── SalesRepository.java
├── TransferRepository.java
└── FileUploadRepository.java
```

### Service Files
```
service/
├── CsvProcessingService.java    # CSV parsing
├── ColumnMappingService.java    # Column transformation
└── DataImportService.java        # Data import logic
```

### Controller Files
```
controller/
├── FileController.java          # File upload endpoints
├── ProductController.java       # Product endpoints
├── StockController.java         # Stock endpoints
├── SalesController.java         # Sales endpoints
└── TransferController.java      # Transfer endpoints
```

### DTO Files
```
dto/
├── ApiResponse.java             # Standard API response wrapper
├── ColumnMappingDTO.java        # Single column mapping
├── FileMappingConfigDTO.java    # Complete mapping configuration
├── ValidationResult.java        # Validation results
├── ImportResult.java            # Import statistics
├── ParseHeadersResponse.java    # CSV header parsing result
└── RequiredColumnsResponse.java # Required columns response
```

---

## Common Patterns

### Repository Pattern
- All repositories extend `JpaRepository<Entity, ID>`
- Custom queries use `@Query` annotation
- Method naming: `findBy...`, `countBy...`, `existsBy...`

### Service Pattern
- Services contain business logic
- Services use repositories for data access
- Services handle transactions

### DTO Pattern
- Controllers receive/return DTOs, not entities
- DTOs separate API contract from database model
- Prevents exposing internal structure

### Exception Handling
- `GlobalExceptionHandler` catches all exceptions
- Returns standardized `ApiResponse` with error details
- Logs exceptions for debugging

### Configuration Pattern
- `application.properties` - Default config
- `application-dev.properties` - Development profile
- `application-prod.properties` - Production profile
- Use `--spring.profiles.active=dev|prod` to switch

---

## Important Implementation Details

### Foreign Key Management
- Foreign keys stored as `Long` fields (e.g., `idStore`, `idProduct`)
- Relationships use `insertable = false, updatable = false` on `@JoinColumn`
- This allows direct control of FK values without JPA managing them
- Relationships are read-only for navigation purposes

### CSV Processing
- Uses Apache Commons CSV library
- Handles UTF-8 encoding
- Supports standard CSV format (comma-separated, quoted fields)
- First row treated as headers

### Data Validation
- File type validation (must be .csv)
- Column mapping validation (all required columns mapped)
- Row-level validation (data types, business rules)
- Product existence validation (FK constraints)

### Batch Processing
- Uses JPA batch inserts (`hibernate.jdbc.batch_size=50`)
- Processes rows in batches for performance
- Collects errors per row, continues processing

### Error Handling
- File-level errors (invalid format, missing columns)
- Row-level errors (invalid data, missing required fields)
- All errors collected and returned in `ImportResult.errors`

---

## Database Schema Details

### Table: store
```sql
CREATE TABLE store (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,  -- 'store' or 'warehouse'
    lead_time_days INTEGER
);
```

### Table: product
```sql
CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);
```

### Table: stock
```sql
CREATE TABLE stock (
    id_store BIGINT NOT NULL,
    id_product BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (id_store, id_product),
    FOREIGN KEY (id_store) REFERENCES store(id),
    FOREIGN KEY (id_product) REFERENCES product(id)
);
```

### Table: sales
```sql
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    range_date DATE NOT NULL,
    id_store BIGINT NOT NULL,
    id_product BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (id_store) REFERENCES store(id),
    FOREIGN KEY (id_product) REFERENCES product(id)
);
```

### Table: transfer
```sql
CREATE TABLE transfer (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    id_store_sent BIGINT NOT NULL,
    id_store_receive BIGINT NOT NULL,
    id_product BIGINT NOT NULL,
    reason TEXT,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (id_store_sent) REFERENCES store(id),
    FOREIGN KEY (id_store_receive) REFERENCES store(id),
    FOREIGN KEY (id_product) REFERENCES product(id),
    CHECK (id_store_sent != id_store_receive)
);
```

### Table: file_upload
```sql
CREATE TABLE file_upload (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    valid BOOLEAN NOT NULL,
    column_mapping_json TEXT,
    rows_processed INTEGER,
    rows_inserted INTEGER,
    rows_failed INTEGER
);

CREATE TABLE file_upload_errors (
    file_upload_id BIGINT NOT NULL,
    error_message VARCHAR(255),
    FOREIGN KEY (file_upload_id) REFERENCES file_upload(id)
);
```

---

## Quick Reference

### Adding a New Entity
1. Create entity class with `@Entity`, `@Table`
2. Add fields with `@Column` annotations
3. Add relationships with `@ManyToOne` / `@OneToMany`
4. Create repository interface extending `JpaRepository`
5. Create controller with endpoints
6. Add service if business logic needed

### Adding a New Endpoint
1. Add method to controller with `@GetMapping` / `@PostMapping`
2. Inject required service/repository
3. Handle request parameters
4. Call service/repository
5. Return `ApiResponse.success(data, message)`

### Modifying Relationships
1. Update entity classes (both sides of relationship)
2. Update `mappedBy` attribute if needed
3. Ensure foreign key columns exist
4. Test with sample data

### CSV Import Process
1. Parse headers → `CsvProcessingService.parseHeaders()`
2. Get required columns → `ColumnMappingService.getRequiredColumns()`
3. User creates mapping
4. Validate mapping → `ColumnMappingService.validateMapping()`
5. Upload file → `DataImportService.importXxxData()`
6. Transform rows → `ColumnMappingService.transformRow()`
7. Validate & insert → Repository batch save

---

## Testing Considerations

### Unit Tests Should Cover
- Service methods (business logic)
- Column mapping transformation
- CSV parsing
- Data validation rules

### Integration Tests Should Cover
- API endpoints
- Database operations
- File upload flow
- Error handling

### Test Data Requirements
- At least one Store
- At least one Product
- Sample Stock, Sales, Transfer records

---

## Common Modifications

### Adding a New Field to Entity
1. Add field to entity class
2. Add getter/setter
3. Update constructor if needed
4. Database column created automatically (if `ddl-auto=update`)

### Adding a New Filter to Query
1. Add `@RequestParam` to controller method
2. Add filter logic in repository query
3. Update API documentation

### Changing Relationship Type
1. Update `@ManyToOne` / `@OneToMany` annotations
2. Update `mappedBy` attribute
3. Update foreign key constraints if needed

---

## Notes for AI Agents

1. **Always check relationships** before modifying entities
2. **Foreign keys are Long fields**, not entity references in insert/update
3. **Lazy loading** means relationships may not be loaded automatically
4. **Composite keys** require special handling (Stock entity)
5. **Column mapping** is stored as JSON in FileUpload entity
6. **All API responses** use ApiResponse wrapper
7. **Transactions** are managed at service level
8. **Error handling** is centralized in GlobalExceptionHandler

---

**Last Updated:** 2024-01-21  
**Version:** 1.0.0  
**For:** AI Agents working on this codebase
