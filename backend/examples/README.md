# Example CSV Files for Stock Update

These example CSV files demonstrate how to use the stock update functionality with consistency validation.

## Files

1. **stock.csv** - Current stock levels after all operations (CONSISTENT)
2. **sales.csv** - Sales transactions (empty in this example)
3. **transfer.csv** - Transfer transactions with various dates and statuses

**Note:** These files reflect transfers from January 2025 and February 2026. The transfers include both "received" and "in_transit" statuses.

## Data Overview

### Stores and Products Used
- **Store 846546546** (Main Store): Products 1234567890123, 2345678901234, 3456789012345
- **Store 123456789** (Secondary Store): Product 4567890123456
- **Store 999999999** (Main Warehouse): Sending transfers
- **Store 111111111** (Airport Kiosk): Receiving transfers

### Dates
- **2025-01-13**: Received transfer (Warehouse → Secondary Store)
- **2025-01-14**: Received transfer (Warehouse → Main Store)
- **2026-02-06**: Multiple in_transit transfers (various stores → City Center, East Coast, Airport Kiosk)

## Consistency Validation

The validation checks that:
```
Stock(today) = Stock(yesterday) + Transfers(received) - Transfers(sent) - Sales(today)
```

### Stock Changes Summary

**Received Transfers (status = received):**
- 2025-01-13: Warehouse (999999999) → Secondary Store (123456789), USB-C Hub, 30
- 2025-01-14: Warehouse (999999999) → Main Store (846546546), Wireless Mouse, 50

**In Transit Transfers (status = in_transit):**
- Multiple transfers on 2026-02-06 from Warehouse, Secondary Store, and Main Store to City Center, East Coast Distribution, and Airport Kiosk
- Stock is reduced from sending stores when status is "in_transit"
- Stock will be added to receiving stores when status changes to "received"

**Current Stock Levels:**
- Warehouse (999999999): Wireless Mouse = 150, USB-C Hub = 130
- Main Store (846546546): Wireless Mouse = 280, USB-C Hub = 55
- Secondary Store (123456789): USB-C Hub = 110
- City Center (666666666): USB-C Hub = 0 (will receive 15 when transfers are received)
- East Coast Distribution (888888888): USB-C Hub = 0 (will receive 10 when transfers are received)
- Airport Kiosk (111111111): USB-C Hub = 0 (will receive 10 when transfers are received)

## How to Use

### Step 1: Reset Database
1. Delete all tables in your database (or drop and recreate the database)
2. Restart the application - `data.sql` will automatically populate initial data

### Step 2: Upload CSV Files
1. Go to the "Update Stock" page in the application
2. Upload the three CSV files:
   - `stock.csv`
   - `sales.csv`
   - `transfer.csv`
3. **Map the columns** (they should auto-match since column names match backend requirements)
4. **Click "Validate"** to check consistency
5. The validation should pass with no errors
6. **Click "Upload Files"** to import the data

### Step 3: Verify
After upload, the stock levels in the database should match the values in `stock.csv`.

## File Formats

### stock.csv
```csv
id_store,id_product,quantity
1,1,150
1,2,200
...
```

### sales.csv
```csv
id_store,id_product,quantity,range_date
1,1,25,2025-01-15
1,2,30,2025-01-15
...
```

### transfer.csv
```csv
date,id_store_sent,id_store_receive,id_product,reason,quantity,status
2025-01-15,846546546,123456789,1234567890123,Restock store 2,20,in_transit
2025-01-15,999999999,846546546,2345678901234,Restock from warehouse,25,in_transit
...
```

**Note:** The `status` column is optional. If omitted, it defaults to `in_transit`. Valid status values:
- `approved` - Transfer is approved but not yet in transit
- `in_transit` or `in_progress` - Transfer is in progress (stock is reduced from sending store)
- `received` - Transfer has been received (stock is added to receiving store)
- `closed` - Transfer is closed/completed

## Detailed Breakdown

### Store 846546546 (Main Store)

**Product 1234567890123 (Laptop Dell XPS 15):**
- Initial stock: 190
- Sales: 25
- Transfers sent: 20 (to store 123456789) + 5 (to store 111111111) = 25
- Transfers received: 10 (from warehouse 999999999)
- New stock: 190 + 10 - 25 - 25 = **150** ✓

**Product 2345678901234 (Wireless Mouse):**
- Initial stock: 230
- Sales: 30
- Transfers sent: 0
- Transfers received: 25 (from warehouse 999999999)
- New stock: 230 + 25 - 0 - 30 = **225** ✓

**Product 3456789012345 (Mechanical Keyboard):**
- Initial stock: 75
- Sales: 10
- Transfers sent: 0
- Transfers received: 10 (from warehouse 999999999)
- New stock: 75 + 10 - 0 - 10 = **75** ✓

### Store 123456789 (Secondary Store)

**Product 4567890123456 (USB-C Hub):**
- Initial stock: 95
- Sales: 15
- Transfers sent: 0
- Transfers received: 20 (from warehouse 999999999)
- New stock: 95 + 20 - 0 - 15 = **100** ✓

### Scenario 3: Custom Data
You can modify these files to test your own scenarios. Just ensure:
- All dates match (same date in sales.csv and transfer.csv)
- Store IDs and Product IDs exist in your database
- Column names match the backend requirements
