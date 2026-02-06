-- Minimal test data for Inventory Orchestrator
-- This script runs automatically when Spring Boot starts (only if tables are empty)
-- To use this instead of data.sql, rename this file to data.sql or configure spring.sql.init.data-locations

-- Add allow_store_to_store_transfer column to category table if it doesn't exist
ALTER TABLE category 
ADD COLUMN IF NOT EXISTS allow_store_to_store_transfer BOOLEAN NOT NULL DEFAULT true;

-- Insert Categories (only if they don't exist)
INSERT INTO category (id, name, description, allow_store_to_store_transfer)
SELECT * FROM (VALUES
    (1, 'Electronics', 'Electronic devices and accessories', true),
    (2, 'Accessories', 'Various accessories and peripherals', true)
) AS v(id, name, description, allow_store_to_store_transfer)
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category.id = v.id);

-- Insert Stores (only if table is empty)
-- ID equals serial_number (as Long) - auto-derived
INSERT INTO store (id, serial_number, name, city, type, lead_time_days)
SELECT 
    serial_number::bigint AS id,  -- Auto-derive ID from serial_number
    serial_number,
    name,
    city,
    type,
    lead_time_days
FROM (VALUES
    ('100', 'Store A', 'New York', 'store', 2),
    ('200', 'Warehouse B', 'Los Angeles', 'warehouse', 3)
) AS v(serial_number, name, city, type, lead_time_days)
WHERE NOT EXISTS (SELECT 1 FROM store WHERE store.serial_number = v.serial_number);

-- Insert Products (only if they don't exist)
-- ID equals code_barre (as Long) - auto-derived
-- Products are linked to categories
INSERT INTO product (id, code_barre, name, description, category_id)
SELECT 
    code_barre::bigint AS id,  -- Auto-derive ID from code_barre
    code_barre,
    name,
    description,
    category_id
FROM (VALUES
    ('1001', 'Product 1', 'First test product', 1),
    ('1002', 'Product 2', 'Second test product', 1),
    ('1003', 'Product 3', 'Third test product', 2),
    ('1004', 'Product 4', 'Fourth test product', 2)
) AS v(code_barre, name, description, category_id)
WHERE NOT EXISTS (SELECT 1 FROM product WHERE product.code_barre = v.code_barre)
AND EXISTS (SELECT 1 FROM category WHERE category.id = v.category_id);

-- Insert Stock - Initial stock levels for testing
-- Store A (100) and Warehouse B (200)
-- Products: 1001, 1002, 1003, 1004
INSERT INTO stock (id_store, id_product, quantity)
SELECT * FROM (VALUES
    -- Store A (100)
    (100, 1001, 50),   -- Store A - Product 1
    (100, 1002, 30),   -- Store A - Product 2
    (100, 1003, 20),   -- Store A - Product 3
    (100, 1004, 10),   -- Store A - Product 4
    -- Warehouse B (200)
    (200, 1001, 100),  -- Warehouse B - Product 1
    (200, 1002, 80),   -- Warehouse B - Product 2
    (200, 1003, 60),   -- Warehouse B - Product 3
    (200, 1004, 40)    -- Warehouse B - Product 4
) AS v(id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM stock 
    WHERE stock.id_store = v.id_store AND stock.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Insert Sales (historical data for testing)
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO sales (range_date, id_store, id_product, quantity)
SELECT 
    v.range_date::timestamp,
    v.id_store,
    v.id_product,
    v.quantity
FROM (VALUES
    -- Historical sales for testing
    ('2025-01-14 10:00:00'::text, 100, 1001, 5),   -- Store A - Product 1
    ('2025-01-14 11:00:00'::text, 100, 1002, 3),   -- Store A - Product 2
    ('2025-01-13 09:00:00'::text, 100, 1003, 2),   -- Store A - Product 3
    ('2025-01-13 14:00:00'::text, 100, 1004, 1)    -- Store A - Product 4
) AS v(range_date, id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.range_date = v.range_date::timestamp 
    AND sales.id_store = v.id_store 
    AND sales.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Insert Transfers (historical data for testing)
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO transfer (date, id_store_sent, id_store_receive, id_product, reason, quantity, status)
SELECT 
    v.date::timestamp,
    v.id_store_sent,
    v.id_store_receive,
    v.id_product,
    v.reason,
    v.quantity,
    v.status
FROM (VALUES
    -- Historical transfers for testing
    ('2025-01-14 08:00:00'::text, 200, 100, 1001, 'Initial restock', 20, 'received'),  -- Warehouse B -> Store A, Product 1
    ('2025-01-13 09:00:00'::text, 200, 100, 1002, 'Initial restock', 15, 'received'),  -- Warehouse B -> Store A, Product 2
    ('2025-01-12 10:00:00'::text, 200, 100, 1003, 'Restock', 10, 'approved'),          -- Warehouse B -> Store A, Product 3 (approved, not yet in_transit)
    ('2025-01-15 08:00:00'::text, 200, 100, 1001, 'Restock', 25, 'in_transit'),        -- Warehouse B -> Store A, Product 1 (in_transit)
    ('2025-01-15 09:00:00'::text, 200, 100, 1004, 'Restock', 15, 'in_transit')         -- Warehouse B -> Store A, Product 4 (in_transit)
) AS v(date, id_store_sent, id_store_receive, id_product, reason, quantity, status)
WHERE NOT EXISTS (
    SELECT 1 FROM transfer 
    WHERE transfer.date = v.date::timestamp 
    AND transfer.id_store_sent = v.id_store_sent 
    AND transfer.id_store_receive = v.id_store_receive
    AND transfer.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store_sent)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store_receive)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);
