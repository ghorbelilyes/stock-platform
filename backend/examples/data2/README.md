# Example CSV Files for data2.sql (Minimal Test Data)

These CSV files are designed to work with the minimal test data in `data2.sql`.

## Data Overview

### Stores
- **Store A** (ID: 100) - New York, type: store
- **Warehouse B** (ID: 200) - Los Angeles, type: warehouse

### Products
- **Product 1** (ID: 1001) - Electronics
- **Product 2** (ID: 1002) - Electronics
- **Product 3** (ID: 1003) - Accessories
- **Product 4** (ID: 1004) - Accessories

## Files

### stock.csv
Current stock levels for all products in both stores.

### sales.csv
Sales transactions for 2025-01-15 from Store A.

### transfer.csv
Transfer transactions for 2025-01-15:
- 2 transfers with status `in_transit` (Warehouse B → Store A)
- 1 transfer with status `approved` (Warehouse B → Store A)

## Consistency

These files are designed to be consistent with the initial data in `data2.sql`:
- Initial stock levels match `data2.sql`
- Sales and transfers are for 2025-01-15
- All calculations are mathematically correct

## Usage

1. Delete all tables in your database
2. Restart the application - `data2.sql` will populate initial data
3. Upload these CSV files via the "Update Stock" page
4. Validate consistency
5. Upload to update the database
