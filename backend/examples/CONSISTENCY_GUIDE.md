# Stock Update Consistency Guide

## Overview

This guide explains the consistent data setup for testing the stock update functionality. All files are mathematically consistent and will pass validation.

## Files Created

1. **`data.sql`** - Updated with clean initial stock data (as of 2025-01-14)
2. **`stock.csv`** - New stock levels after operations on 2025-01-15
3. **`sales.csv`** - Sales transactions for 2025-01-15
4. **`transfer.csv`** - Transfer transactions for 2025-01-15

## Consistency Formula

```
New Stock = Initial Stock + Transfers Received - Transfers Sent - Sales
```

## Detailed Calculations

### Store 846546546 (Main Store)

#### Product 1234567890123 (Laptop Dell XPS 15)
- **Initial Stock** (from data.sql): 190
- **Sales** (2025-01-15): 25
- **Transfers Sent**: 
  - 20 to store 123456789
  - 5 to store 111111111
  - **Total Sent**: 25
- **Transfers Received**: 
  - 10 from warehouse 999999999
  - **Total Received**: 10
- **Calculation**: 190 + 10 - 25 - 25 = **150** ✓
- **New Stock** (in stock.csv): 150

#### Product 2345678901234 (Wireless Mouse)
- **Initial Stock**: 230
- **Sales**: 30
- **Transfers Sent**: 0
- **Transfers Received**: 25 (from warehouse 999999999)
- **Calculation**: 230 + 25 - 0 - 30 = **225** ✓
- **New Stock**: 225

#### Product 3456789012345 (Mechanical Keyboard)
- **Initial Stock**: 75
- **Sales**: 10
- **Transfers Sent**: 0
- **Transfers Received**: 10 (from warehouse 999999999)
- **Calculation**: 75 + 10 - 0 - 10 = **75** ✓
- **New Stock**: 75

### Store 123456789 (Secondary Store)

#### Product 4567890123456 (USB-C Hub)
- **Initial Stock**: 95
- **Sales**: 15
- **Transfers Sent**: 0
- **Transfers Received**: 20 (from warehouse 999999999)
- **Calculation**: 95 + 20 - 0 - 15 = **100** ✓
- **New Stock**: 100

## How to Use

### Step 1: Reset Database
```sql
-- Option 1: Drop and recreate database
DROP DATABASE your_database;
CREATE DATABASE your_database;

-- Option 2: Delete all data
TRUNCATE TABLE stock, sales, transfer CASCADE;
```

### Step 2: Restart Application
The `data.sql` file will automatically populate initial data when Spring Boot starts (if tables are empty).

### Step 3: Upload CSV Files
1. Navigate to "Update Stock" page
2. Upload `stock.csv`, `sales.csv`, and `transfer.csv`
3. Map columns (should auto-match)
4. Click "Validate" - should pass with no errors
5. Click "Upload Files" to import

### Step 4: Verify Results
After upload, check that stock levels match `stock.csv`:
- Store 846546546, Product 1234567890123: 150
- Store 846546546, Product 2345678901234: 225
- Store 846546546, Product 3456789012345: 75
- Store 123456789, Product 4567890123456: 100

## File Locations

- **data.sql**: `/backend/src/main/resources/data.sql`
- **CSV files**: `/backend/examples/`
  - `stock.csv`
  - `sales.csv`
  - `transfer.csv`

## Notes

- All transactions are dated **2025-01-15**
- Only products that change are included in the CSV files
- Other products remain unchanged (not in CSV = no update)
- Transfer status is not included in CSV (defaults to 'in_transit' or handled by backend)
- All calculations are verified and consistent
