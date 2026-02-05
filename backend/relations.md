## Database Schema & Relationships

### Complete Entity Relationship Diagram

```
                    ┌──────────────┐
                    │    Store     │
                    │              │
                    │ - id (PK)    │ UUID
                    │ - serial_number │ (unique, external ID)
                    │ - name       │
                    │ - city       │
                    │ - type       │
                    │ - leadTimeDays│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼──────┐      ┌─────▼──────┐    ┌─────▼──────┐
   │  Stock    │      │   Sales    │    │  Transfer  │
   │           │      │            │    │            │
   │ - id_store│      │ - id (PK)  │    │ - id (PK)  │
   │   (FK)    │      │   UUID     │    │   UUID     │
   │   UUID    │      │ - id_store │    │ - id_store │
   │ - id_prod │      │   (FK)     │    │   _sent    │
   │   (FK)    │      │   UUID     │    │   (FK)     │
   │   UUID    │      │ - id_prod  │    │   UUID     │
   │ - quantity│      │   (FK)     │    │ - id_store │
   │           │      │   UUID     │    │   _receive │
   │ (PK: store│      │ - quantity │    │   (FK)     │
   │  + product)│     │ - rangeDate│    │   UUID     │
   └─────┬─────┘      └─────┬──────┘    │ - id_prod  │
         │                  │            │   (FK)     │
         │                  │            │   UUID     │
         └──────────────────┼────────────│ - reason   │
                            │            │ - quantity │
                            │            │ - status   │ (approved|in_transit|received|closed)
                    ┌───────▼───────┐    └────────────┘
                    │   Product     │
                    │               │
                    │ - id (PK)     │ UUID
                    │ - code_barre  │ (unique, external ID)
                    │ - name        │
                    │ - description │
                    └───────────────┘

                    ┌──────────────┐
                    │  FileUpload  │
                    │              │
                    │ - id (PK)    │ UUID
                    │ - fileName   │
                    │ - fileType   │ (STOCK|SALES|TRANSFER|STORE|PRODUCT)
                    │ - uploadedAt │
                    │ - valid      │
                    │ - errors     │
                    │ - columnMappingJson│
                    │ - rowsProcessed│
                    │ - rowsInserted│
                    │ - rowsFailed │
                    └──────────────┘
```

### Relationship Details

#### Store Entity Relationships
- **One-to-Many with Stock:** `Store 1 ──< Stock` (one store has many stock entries)
  - Mapping: `@OneToMany(mappedBy = "store")` in Store
  - Foreign Key: `Stock.id_store (UUID) → Store.id (UUID)`
  
- **One-to-Many with Sales:** `Store 1 ──< Sales` (one store has many sales)
  - Mapping: `@OneToMany(mappedBy = "store")` in Store
  - Foreign Key: `Sales.id_store (UUID) → Store.id (UUID)`
  
- **One-to-Many with Transfer (as sender):** `Store 1 ──< Transfer` (storeSent)
  - Mapping: `@OneToMany(mappedBy = "storeSent")` in Store
  - Foreign Key: `Transfer.id_store_sent (UUID) → Store.id (UUID)`
  
- **One-to-Many with Transfer (as receiver):** `Store 1 ──< Transfer` (storeReceive)
  - Mapping: `@OneToMany(mappedBy = "storeReceive")` in Store
  - Foreign Key: `Transfer.id_store_receive (UUID) → Store.id (UUID)`

#### Product Entity Relationships
- **One-to-Many with Stock:** `Product 1 ──< Stock` (one product in many stores)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Stock.id_product (UUID) → Product.id (UUID)`
  
- **One-to-Many with Sales:** `Product 1 ──< Sales` (one product has many sales)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Sales.id_product (UUID) → Product.id (UUID)`
  
- **One-to-Many with Transfer:** `Product 1 ──< Transfer` (one product transferred many times)
  - Mapping: `@OneToMany(mappedBy = "product")` in Product
  - Foreign Key: `Transfer.id_product (UUID) → Product.id (UUID)`

#### Stock Entity Relationships
- **Many-to-One with Store:** `Stock >── 1 Store` (many stocks belong to one store)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store")` in Stock
  - Composite Primary Key: `(id_store (UUID), id_product (UUID))`
  
- **Many-to-One with Product:** `Stock >── 1 Product` (many stocks for one product)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Stock

#### Sales Entity Relationships
- **Many-to-One with Store:** `Sales >── 1 Store`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store")` in Sales
  - Primary Key: `id (UUID)`
  
- **Many-to-One with Product:** `Sales >── 1 Product`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Sales

#### Transfer Entity Relationships
- **Many-to-One with Store (sender):** `Transfer >── 1 Store` (storeSent)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store_sent")` in Transfer
  - Primary Key: `id (UUID)`
  
- **Many-to-One with Store (receiver):** `Transfer >── 1 Store` (storeReceive)
  - Mapping: `@ManyToOne @JoinColumn(name = "id_store_receive")` in Transfer
  
- **Many-to-One with Product:** `Transfer >── 1 Product`
  - Mapping: `@ManyToOne @JoinColumn(name = "id_product")` in Transfer

#### FileUpload Entity
- **Standalone entity** (no foreign key relationships)
  - Tracks file upload metadata and import results
  - Stores column mapping configuration as JSON
  - Records validation and import statistics

### Foreign Key Constraints

| Table    | Column          | References      | Data Type | Relationship Type |
|----------|----------------|-----------------|-----------|-------------------|
| stock    | id_store       | store.id        | UUID      | Many-to-One       |
| stock    | id_product     | product.id      | UUID      | Many-to-One       |
| sales    | id_store       | store.id        | UUID      | Many-to-One       |
| sales    | id_product     | product.id      | UUID      | Many-to-One       |
| transfer | id_store_sent  | store.id        | UUID      | Many-to-One       |
| transfer | id_store_receive| store.id       | UUID      | Many-to-One       |
| transfer | id_product     | product.id      | UUID      | Many-to-One       |

### Primary Key Information

| Entity     | Primary Key Type | Primary Key Field(s) | Generation Strategy |
|------------|------------------|----------------------|---------------------|
| Store      | UUID             | id                   | UUID                |
| Product    | UUID             | id                   | UUID                |
| Sales      | UUID             | id                   | UUID                |
| Transfer   | UUID             | id                   | UUID                |
| Stock      | Composite (UUID) | (id_store, id_product) | N/A (composite) |
| FileUpload | UUID             | id                   | UUID                |

### Unique Constraints

| Entity  | Field           | Constraint Type | Purpose                          |
|---------|-----------------|-----------------|----------------------------------|
| Store   | serial_number   | UNIQUE          | External identifier for stores  |
| Product | code_barre      | UNIQUE          | Barcode identifier for products |

### Important Notes

1. **All IDs are UUIDs**: All primary keys and foreign keys use UUID (Universally Unique Identifier) type instead of numeric IDs. This provides:
   - Better security (non-sequential, harder to guess)
   - Distributed system compatibility
   - No collision risk across different systems

2. **External Identifiers**: 
   - `Store.serial_number`: Used for external identification when importing stores from CSV files. The import logic checks for existing stores by `serial_number` and updates them if found.
   - `Product.code_barre`: Used for external identification when importing products from CSV files. The import logic checks for existing products by `code_barre` and updates them if found.

3. **Composite Key**: The `Stock` table uses a composite primary key consisting of `(id_store, id_product)`, meaning each product can only have one stock entry per store.

4. **File Upload Tracking**: The `FileUpload` entity tracks all CSV file uploads, including validation results, column mappings, and import statistics. This is separate from the main inventory entities and has no foreign key relationships.

5. **Transfer status**: The `transfer` table has a `status` column (`VARCHAR(32)`, default `'in_transit'`). Lifecycle: `approved` → `in_transit` (en route) → `received` → `closed`. Transfers created from approved suggestions get status `in_transit`. Migration: `003_add_transfer_status.sql`.

6. **Transfer suggestions**: Computed by `TransferSuggestionService` from stock levels (no DB table). Suggestions pair donor stores (excess stock) with receiver stores (low/zero stock). Endpoints: `GET /transfers/suggestions`, `POST /transfers/suggestions/approve`.
