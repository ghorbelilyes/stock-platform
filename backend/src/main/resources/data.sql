-- Default data for Inventory Orchestrator
-- This script runs automatically when Spring Boot starts (only if tables are empty)
-- To disable: set spring.sql.init.mode=never in application.properties

-- Add allow_store_to_store_transfer column to category table if it doesn't exist
ALTER TABLE category 
ADD COLUMN IF NOT EXISTS allow_store_to_store_transfer BOOLEAN NOT NULL DEFAULT true;

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
    ('846546546', 'Main Store', 'New York', 'store', 3),
    ('123456789', 'Secondary Store', 'Los Angeles', 'store', 2),
    ('111111111', 'Airport Kiosk', 'Chicago', 'store', 1),
    ('999999999', 'Main Warehouse', 'Dallas', 'warehouse', 5),
    ('888888888', 'East Coast Distribution', 'Boston', 'warehouse', 4),
    ('777777777', 'Suburban Store', 'Miami', 'store', 3),
    ('666666666', 'City Center', 'Seattle', 'store', 2)
) AS v(serial_number, name, city, type, lead_time_days)
WHERE NOT EXISTS (SELECT 1 FROM store WHERE store.serial_number = v.serial_number);

-- Insert Categories (only if they don't exist)
-- Note: Using explicit ID insertion with sequence reset for IDENTITY columns
INSERT INTO category (id, name, description, allow_store_to_store_transfer)
SELECT * FROM (VALUES
    (1, 'Computers & Laptops', 'Desktop computers, laptops, and workstations', true),
    (2, 'Peripherals', 'Mice, keyboards, webcams, and other input devices', true),
    (3, 'Monitors & Displays', 'Computer monitors, displays, and screens', true),
    (4, 'Audio Equipment', 'Headphones, speakers, and audio accessories', true),
    (5, 'Storage Devices', 'External hard drives, SSDs, and storage solutions', true),
    (6, 'Accessories', 'Docking stations, hubs, converters, and other accessories', true)
) AS v(id, name, description, allow_store_to_store_transfer)
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category.id = v.id);

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
    ('1234567890123', 'Laptop Dell XPS 15', 'High-performance laptop with 15-inch display; Intel i7 processor; 16GB RAM; 512GB SSD', 1),
    ('2345678901234', 'Wireless Mouse Logitech MX Master 3', 'Ergonomic wireless mouse with precision tracking and multi-device connectivity', 2),
    ('3456789012345', 'Mechanical Keyboard Keychron K8', 'Wireless mechanical keyboard with RGB backlighting and hot-swappable switches', 2),
    ('4567890123456', 'USB-C Hub 7-in-1', 'Multi-port USB-C hub with HDMI; USB 3.0; SD card reader; and power delivery', 6),
    ('5678901234567', 'Monitor LG UltraWide 34', '34-inch ultrawide curved monitor with 3440x1440 resolution and USB-C connectivity', 3),
    ('6789012345678', 'Webcam Logitech C920 HD', '1080p HD webcam with autofocus and stereo audio', 2),
    ('7890123456789', 'Standing Desk Converter', 'Adjustable height desk converter for ergonomic workspace setup', 6),
    ('8901234567890', 'Noise Cancelling Headphones Sony WH-1000XM5', 'Wireless over-ear headphones with industry-leading noise cancellation', 4),
    ('9012345678901', 'External SSD Samsung T7 1TB', 'Portable SSD with USB 3.2 Gen 2; read speeds up to 1050MB/s', 5),
    ('0123456789012', 'Docking Station Dell WD19', 'USB-C docking station with dual display support and 90W power delivery', 6)
) AS v(code_barre, name, description, category_id)
WHERE NOT EXISTS (SELECT 1 FROM product WHERE product.code_barre = v.code_barre)
AND EXISTS (SELECT 1 FROM category WHERE category.id = v.category_id);

-- Insert Stock (only if they don't exist)
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO stock (id_store, id_product, quantity)
SELECT * FROM (VALUES
    (846546546, 1234567890123, 25),   -- Main Store - Laptop Dell XPS 15
    (846546546, 2345678901234, 150),  -- Main Store - Wireless Mouse
    (846546546, 3456789012345, 80),   -- Main Store - Mechanical Keyboard
    (846546546, 4567890123456, 60),   -- Main Store - USB-C Hub
    (846546546, 5678901234567, 15),   -- Main Store - Monitor
    (846546546, 6789012345678, 40),   -- Main Store - Webcam
    (846546546, 7890123456789, 30),   -- Main Store - Standing Desk Converter
    (846546546, 8901234567890, 50),   -- Main Store - Headphones
    (846546546, 9012345678901, 35),   -- Main Store - External SSD
    (846546546, 123456789012, 20),    -- Main Store - Docking Station
    (123456789, 1234567890123, 30),   -- Secondary Store - Laptop Dell XPS 15
    (123456789, 2345678901234, 120),  -- Secondary Store - Wireless Mouse
    (123456789, 3456789012345, 100),  -- Secondary Store - Mechanical Keyboard
    (123456789, 4567890123456, 75),   -- Secondary Store - USB-C Hub
    (123456789, 5678901234567, 20),   -- Secondary Store - Monitor
    (123456789, 6789012345678, 45),   -- Secondary Store - Webcam
    (123456789, 7890123456789, 25),   -- Secondary Store - Standing Desk Converter
    (123456789, 8901234567890, 60),   -- Secondary Store - Headphones
    (123456789, 9012345678901, 40),   -- Secondary Store - External SSD
    (123456789, 123456789012, 15),    -- Secondary Store - Docking Station
    (999999999, 1234567890123, 100),  -- Main Warehouse - Laptop Dell XPS 15
    (999999999, 2345678901234, 200),  -- Main Warehouse - Wireless Mouse
    (999999999, 3456789012345, 150),  -- Main Warehouse - Mechanical Keyboard
    (999999999, 4567890123456, 180),  -- Main Warehouse - USB-C Hub
    (999999999, 5678901234567, 75),   -- Main Warehouse - Monitor
    (999999999, 6789012345678, 120),  -- Main Warehouse - Webcam
    (999999999, 7890123456789, 90),   -- Main Warehouse - Standing Desk Converter
    (999999999, 8901234567890, 150),  -- Main Warehouse - Headphones
    (999999999, 9012345678901, 100),  -- Main Warehouse - External SSD
    (999999999, 123456789012, 80)     -- Main Warehouse - Docking Station
) AS v(id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM stock 
    WHERE stock.id_store = v.id_store AND stock.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Stock for stores with low/zero levels to generate transfer suggestions (Airport Kiosk, City Center, Suburban)
INSERT INTO stock (id_store, id_product, quantity)
SELECT * FROM (VALUES
    (111111111, 1234567890123, 0),    -- Airport Kiosk - Laptop (out)
    (111111111, 2345678901234, 2),    -- Airport Kiosk - Mouse (low)
    (111111111, 5678901234567, 0),    -- Airport Kiosk - Monitor (out)
    (111111111, 8901234567890, 1),    -- Airport Kiosk - Headphones (low)
    (666666666, 1234567890123, 2),    -- City Center - Laptop (low)
    (666666666, 3456789012345, 0),    -- City Center - Keyboard (out)
    (666666666, 6789012345678, 1),    -- City Center - Webcam (low)
    (666666666, 9012345678901, 0),    -- City Center - External SSD (out)
    (777777777, 4567890123456, 3),    -- Suburban - USB-C Hub (low)
    (777777777, 7890123456789, 0),    -- Suburban - Standing Desk (out)
    (777777777, 123456789012, 2)      -- Suburban - Docking Station (low)
) AS v(id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM stock
    WHERE stock.id_store = v.id_store AND stock.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Insert Sales (last 14 days - ~200 records)
-- Using dates from the last 14 days from current date
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO sales (range_date, id_store, id_product, quantity)
SELECT 
    v.range_date::date,
    v.id_store,
    v.id_product,
    v.quantity
FROM (VALUES
    ('2026-02-04'::text, 846546546, 5678901234567, 1),
    ('2026-02-04'::text, 846546546, 4567890123456, 3),
    ('2026-02-04'::text, 666666666, 6789012345678, 3),
    ('2026-02-04'::text, 666666666, 123456789012, 6),
    ('2026-02-04'::text, 777777777, 8901234567890, 7),
    ('2026-02-04'::text, 777777777, 1234567890123, 3),
    ('2026-02-04'::text, 123456789, 4567890123456, 8),
    ('2026-02-04'::text, 123456789, 8901234567890, 3),
    ('2026-02-04'::text, 666666666, 5678901234567, 1),
    ('2026-02-04'::text, 777777777, 3456789012345, 4),
    ('2026-02-04'::text, 846546546, 8901234567890, 4),
    ('2026-02-04'::text, 777777777, 123456789012, 3),
    ('2026-02-04'::text, 777777777, 3456789012345, 7),
    ('2026-02-04'::text, 846546546, 6789012345678, 1),
    ('2026-02-04'::text, 777777777, 2345678901234, 3),
    ('2026-02-04'::text, 666666666, 1234567890123, 2),
    ('2026-02-03'::text, 111111111, 3456789012345, 5),
    ('2026-02-03'::text, 111111111, 123456789012, 7),
    ('2026-02-03'::text, 846546546, 6789012345678, 1),
    ('2026-02-03'::text, 846546546, 123456789012, 6),
    ('2026-02-03'::text, 846546546, 7890123456789, 2),
    ('2026-02-03'::text, 846546546, 5678901234567, 7),
    ('2026-02-03'::text, 666666666, 5678901234567, 7),
    ('2026-02-03'::text, 846546546, 8901234567890, 7),
    ('2026-02-03'::text, 777777777, 123456789012, 6),
    ('2026-02-03'::text, 846546546, 6789012345678, 2),
    ('2026-02-03'::text, 666666666, 7890123456789, 5),
    ('2026-02-03'::text, 111111111, 5678901234567, 1),
    ('2026-02-02'::text, 111111111, 5678901234567, 5),
    ('2026-02-02'::text, 123456789, 2345678901234, 1),
    ('2026-02-02'::text, 123456789, 2345678901234, 4),
    ('2026-02-02'::text, 123456789, 7890123456789, 1),
    ('2026-02-02'::text, 111111111, 123456789012, 4),
    ('2026-02-02'::text, 123456789, 4567890123456, 7),
    ('2026-02-02'::text, 777777777, 1234567890123, 4),
    ('2026-02-02'::text, 846546546, 5678901234567, 3),
    ('2026-02-02'::text, 123456789, 3456789012345, 7),
    ('2026-02-02'::text, 123456789, 4567890123456, 7),
    ('2026-02-02'::text, 777777777, 3456789012345, 5),
    ('2026-02-02'::text, 777777777, 8901234567890, 2),
    ('2026-02-02'::text, 111111111, 8901234567890, 4),
    ('2026-02-01'::text, 846546546, 9012345678901, 5),
    ('2026-02-01'::text, 846546546, 3456789012345, 6),
    ('2026-02-01'::text, 123456789, 7890123456789, 2),
    ('2026-02-01'::text, 111111111, 7890123456789, 3),
    ('2026-02-01'::text, 111111111, 6789012345678, 5),
    ('2026-02-01'::text, 123456789, 8901234567890, 5),
    ('2026-02-01'::text, 777777777, 123456789012, 4),
    ('2026-02-01'::text, 123456789, 5678901234567, 2),
    ('2026-02-01'::text, 111111111, 7890123456789, 2),
    ('2026-01-31'::text, 111111111, 7890123456789, 1),
    ('2026-01-31'::text, 846546546, 3456789012345, 4),
    ('2026-01-31'::text, 123456789, 9012345678901, 3),
    ('2026-01-31'::text, 777777777, 123456789012, 4),
    ('2026-01-31'::text, 777777777, 2345678901234, 6),
    ('2026-01-31'::text, 111111111, 8901234567890, 3),
    ('2026-01-31'::text, 111111111, 1234567890123, 5),
    ('2026-01-31'::text, 111111111, 2345678901234, 7),
    ('2026-01-31'::text, 111111111, 4567890123456, 6),
    ('2026-01-30'::text, 111111111, 3456789012345, 7),
    ('2026-01-30'::text, 111111111, 6789012345678, 6),
    ('2026-01-30'::text, 666666666, 8901234567890, 8),
    ('2026-01-30'::text, 846546546, 7890123456789, 7),
    ('2026-01-30'::text, 123456789, 1234567890123, 7),
    ('2026-01-30'::text, 846546546, 7890123456789, 8),
    ('2026-01-30'::text, 111111111, 8901234567890, 4),
    ('2026-01-30'::text, 123456789, 3456789012345, 6),
    ('2026-01-30'::text, 123456789, 5678901234567, 3),
    ('2026-01-30'::text, 846546546, 8901234567890, 7),
    ('2026-01-30'::text, 777777777, 123456789012, 7),
    ('2026-01-30'::text, 777777777, 4567890123456, 3),
    ('2026-01-30'::text, 123456789, 7890123456789, 8),
    ('2026-01-30'::text, 666666666, 9012345678901, 2),
    ('2026-01-30'::text, 123456789, 1234567890123, 7),
    ('2026-01-30'::text, 123456789, 123456789012, 7),
    ('2026-01-30'::text, 111111111, 1234567890123, 8),
    ('2026-01-30'::text, 111111111, 2345678901234, 7),
    ('2026-01-29'::text, 777777777, 3456789012345, 8),
    ('2026-01-29'::text, 111111111, 9012345678901, 2),
    ('2026-01-29'::text, 777777777, 2345678901234, 4),
    ('2026-01-29'::text, 666666666, 123456789012, 8),
    ('2026-01-29'::text, 846546546, 3456789012345, 6),
    ('2026-01-29'::text, 777777777, 5678901234567, 5),
    ('2026-01-29'::text, 846546546, 1234567890123, 3),
    ('2026-01-29'::text, 111111111, 123456789012, 8),
    ('2026-01-29'::text, 111111111, 8901234567890, 4),
    ('2026-01-29'::text, 111111111, 123456789012, 5),
    ('2026-01-29'::text, 111111111, 4567890123456, 3),
    ('2026-01-29'::text, 846546546, 7890123456789, 2),
    ('2026-01-28'::text, 111111111, 8901234567890, 3),
    ('2026-01-28'::text, 777777777, 9012345678901, 3),
    ('2026-01-28'::text, 777777777, 9012345678901, 1),
    ('2026-01-28'::text, 777777777, 9012345678901, 2),
    ('2026-01-28'::text, 666666666, 6789012345678, 1),
    ('2026-01-28'::text, 666666666, 7890123456789, 4),
    ('2026-01-28'::text, 123456789, 8901234567890, 1),
    ('2026-01-28'::text, 123456789, 1234567890123, 6),
    ('2026-01-28'::text, 111111111, 1234567890123, 1),
    ('2026-01-28'::text, 666666666, 7890123456789, 3),
    ('2026-01-28'::text, 123456789, 7890123456789, 4),
    ('2026-01-28'::text, 666666666, 7890123456789, 8),
    ('2026-01-28'::text, 846546546, 9012345678901, 4),
    ('2026-01-28'::text, 777777777, 7890123456789, 7),
    ('2026-01-28'::text, 846546546, 6789012345678, 4),
    ('2026-01-27'::text, 123456789, 1234567890123, 1),
    ('2026-01-27'::text, 111111111, 5678901234567, 3),
    ('2026-01-27'::text, 777777777, 8901234567890, 2),
    ('2026-01-27'::text, 123456789, 9012345678901, 1),
    ('2026-01-27'::text, 846546546, 3456789012345, 1),
    ('2026-01-27'::text, 123456789, 9012345678901, 5),
    ('2026-01-27'::text, 846546546, 123456789012, 7),
    ('2026-01-27'::text, 111111111, 6789012345678, 3),
    ('2026-01-27'::text, 777777777, 8901234567890, 6),
    ('2026-01-27'::text, 846546546, 2345678901234, 2),
    ('2026-01-27'::text, 777777777, 7890123456789, 5),
    ('2026-01-27'::text, 666666666, 3456789012345, 1),
    ('2026-01-27'::text, 111111111, 4567890123456, 4),
    ('2026-01-27'::text, 777777777, 9012345678901, 8),
    ('2026-01-27'::text, 666666666, 3456789012345, 5),
    ('2026-01-27'::text, 846546546, 123456789012, 4),
    ('2026-01-26'::text, 111111111, 3456789012345, 8),
    ('2026-01-26'::text, 111111111, 1234567890123, 7),
    ('2026-01-26'::text, 123456789, 5678901234567, 5),
    ('2026-01-26'::text, 777777777, 8901234567890, 1),
    ('2026-01-26'::text, 666666666, 5678901234567, 3),
    ('2026-01-26'::text, 846546546, 8901234567890, 5),
    ('2026-01-26'::text, 123456789, 8901234567890, 4),
    ('2026-01-26'::text, 666666666, 123456789012, 3),
    ('2026-01-26'::text, 666666666, 123456789012, 7),
    ('2026-01-26'::text, 846546546, 123456789012, 2),
    ('2026-01-26'::text, 846546546, 3456789012345, 7),
    ('2026-01-26'::text, 123456789, 123456789012, 4),
    ('2026-01-26'::text, 111111111, 4567890123456, 2),
    ('2026-01-26'::text, 666666666, 5678901234567, 6),
    ('2026-01-26'::text, 846546546, 9012345678901, 6),
    ('2026-01-26'::text, 846546546, 9012345678901, 5),
    ('2026-01-26'::text, 123456789, 6789012345678, 7),
    ('2026-01-25'::text, 777777777, 5678901234567, 5),
    ('2026-01-25'::text, 666666666, 123456789012, 4),
    ('2026-01-25'::text, 123456789, 5678901234567, 1),
    ('2026-01-25'::text, 111111111, 7890123456789, 6),
    ('2026-01-25'::text, 846546546, 6789012345678, 1),
    ('2026-01-25'::text, 111111111, 8901234567890, 5),
    ('2026-01-25'::text, 123456789, 8901234567890, 2),
    ('2026-01-25'::text, 666666666, 123456789012, 4),
    ('2026-01-25'::text, 123456789, 1234567890123, 8),
    ('2026-01-25'::text, 777777777, 6789012345678, 8),
    ('2026-01-25'::text, 777777777, 4567890123456, 5),
    ('2026-01-24'::text, 777777777, 8901234567890, 8),
    ('2026-01-24'::text, 777777777, 7890123456789, 4),
    ('2026-01-24'::text, 111111111, 1234567890123, 6),
    ('2026-01-24'::text, 777777777, 8901234567890, 3),
    ('2026-01-24'::text, 777777777, 2345678901234, 5),
    ('2026-01-24'::text, 777777777, 9012345678901, 4),
    ('2026-01-24'::text, 846546546, 5678901234567, 3),
    ('2026-01-24'::text, 666666666, 8901234567890, 4),
    ('2026-01-24'::text, 111111111, 8901234567890, 1),
    ('2026-01-24'::text, 846546546, 5678901234567, 3),
    ('2026-01-24'::text, 111111111, 123456789012, 2),
    ('2026-01-23'::text, 666666666, 8901234567890, 2),
    ('2026-01-23'::text, 111111111, 4567890123456, 2),
    ('2026-01-23'::text, 666666666, 5678901234567, 4),
    ('2026-01-23'::text, 777777777, 2345678901234, 4),
    ('2026-01-23'::text, 123456789, 1234567890123, 5),
    ('2026-01-23'::text, 846546546, 9012345678901, 4),
    ('2026-01-23'::text, 666666666, 4567890123456, 5),
    ('2026-01-23'::text, 123456789, 9012345678901, 3),
    ('2026-01-23'::text, 777777777, 6789012345678, 5),
    ('2026-01-23'::text, 123456789, 1234567890123, 8),
    ('2026-01-23'::text, 123456789, 1234567890123, 1),
    ('2026-01-23'::text, 846546546, 6789012345678, 8),
    ('2026-01-23'::text, 666666666, 5678901234567, 1),
    ('2026-01-22'::text, 666666666, 8901234567890, 7),
    ('2026-01-22'::text, 123456789, 6789012345678, 1),
    ('2026-01-22'::text, 846546546, 2345678901234, 7),
    ('2026-01-22'::text, 777777777, 8901234567890, 6),
    ('2026-01-22'::text, 123456789, 3456789012345, 3),
    ('2026-01-22'::text, 777777777, 3456789012345, 5),
    ('2026-01-22'::text, 777777777, 5678901234567, 6),
    ('2026-01-22'::text, 777777777, 2345678901234, 7),
    ('2026-01-22'::text, 123456789, 123456789012, 7),
    ('2026-01-22'::text, 123456789, 6789012345678, 7),
    ('2026-01-22'::text, 846546546, 123456789012, 3),
    ('2026-01-22'::text, 111111111, 7890123456789, 4),
    ('2026-01-22'::text, 777777777, 1234567890123, 8),
    ('2026-01-22'::text, 777777777, 7890123456789, 1),
    ('2026-01-22'::text, 666666666, 6789012345678, 6),
    ('2026-01-22'::text, 777777777, 5678901234567, 7),
    ('2026-01-22'::text, 846546546, 2345678901234, 7),
    ('2026-01-22'::text, 777777777, 3456789012345, 1),
    ('2026-01-21'::text, 846546546, 1234567890123, 2),
    ('2026-01-21'::text, 846546546, 2345678901234, 5),
    ('2026-01-21'::text, 123456789, 1234567890123, 1),
    ('2026-01-21'::text, 123456789, 4567890123456, 3),
    ('2026-01-21'::text, 111111111, 2345678901234, 4),
    ('2026-01-21'::text, 846546546, 3456789012345, 2),
    ('2026-01-21'::text, 123456789, 5678901234567, 1),
    ('2026-01-21'::text, 777777777, 8901234567890, 3),
    ('2026-01-21'::text, 777777777, 9012345678901, 2),
    ('2026-01-21'::text, 666666666, 1234567890123, 1),
    ('2026-01-21'::text, 666666666, 2345678901234, 8),
    ('2026-01-21'::text, 846546546, 4567890123456, 4),
    ('2026-01-21'::text, 123456789, 6789012345678, 2),
    ('2026-01-21'::text, 111111111, 6789012345678, 1),
    ('2026-01-21'::text, 777777777, 123456789012, 1),
    ('2026-01-21'::text, 666666666, 123456789012, 5),
    ('2026-01-21'::text, 846546546, 5678901234567, 1),
    ('2026-01-21'::text, 123456789, 8901234567890, 2),
    ('2026-01-21'::text, 777777777, 123456789012, 3)
) AS v(range_date, id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.range_date = v.range_date::date 
    AND sales.id_store = v.id_store 
    AND sales.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Insert Transfers (last 14 days - ~30 records)
-- Warehouse to stores transfers; status: in_transit (en cours), received, closed
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO transfer (date, id_store_sent, id_store_receive, id_product, reason, quantity, status)
SELECT 
    v.date::date,
    v.id_store_sent,
    v.id_store_receive,
    v.id_product,
    v.reason,
    v.quantity,
    v.status
FROM (VALUES
    ('2026-02-04'::text, 999999999, 846546546, 2345678901234, 'Low stock replenishment', 30, 'in_transit'),
    ('2026-02-03'::text, 999999999, 846546546, 5678901234567, 'Restock after high sales', 35, 'in_transit'),
    ('2026-02-03'::text, 999999999, 846546546, 1234567890123, 'Restock after high sales', 22, 'received'),
    ('2026-02-02'::text, 888888888, 846546546, 123456789012, 'Low stock replenishment', 6, 'received'),
    ('2026-02-01'::text, 999999999, 666666666, 6789012345678, 'Restock after high sales', 7, 'in_transit'),
    ('2026-01-31'::text, 999999999, 111111111, 3456789012345, 'Seasonal demand', 16, 'received'),
    ('2026-01-30'::text, 888888888, 777777777, 9012345678901, 'Initial stock allocation', 24, 'received'),
    ('2026-01-30'::text, 999999999, 777777777, 8901234567890, 'Promotional campaign', 22, 'in_transit'),
    ('2026-01-29'::text, 999999999, 666666666, 3456789012345, 'Inventory rebalancing', 45, 'received'),
    ('2026-01-29'::text, 999999999, 111111111, 2345678901234, 'Restock after high sales', 26, 'closed'),
    ('2026-01-29'::text, 999999999, 123456789, 5678901234567, 'Initial stock allocation', 38, 'received'),
    ('2026-01-28'::text, 888888888, 666666666, 5678901234567, 'Low stock replenishment', 16, 'received'),
    ('2026-01-27'::text, 888888888, 846546546, 2345678901234, 'Inventory rebalancing', 46, 'in_transit'),
    ('2026-01-27'::text, 888888888, 123456789, 5678901234567, 'Seasonal demand', 6, 'received'),
    ('2026-01-27'::text, 999999999, 846546546, 7890123456789, 'Seasonal demand', 43, 'received'),
    ('2026-01-26'::text, 999999999, 777777777, 8901234567890, 'Weekly restock', 34, 'in_transit'),
    ('2026-01-26'::text, 999999999, 123456789, 4567890123456, 'Inventory rebalancing', 38, 'received'),
    ('2026-01-26'::text, 999999999, 666666666, 9012345678901, 'Inventory rebalancing', 25, 'received'),
    ('2026-01-25'::text, 888888888, 777777777, 123456789012, 'Store opening stock', 35, 'closed'),
    ('2026-01-24'::text, 888888888, 123456789, 4567890123456, 'Seasonal demand', 22, 'received'),
    ('2026-01-24'::text, 888888888, 666666666, 9012345678901, 'Store opening stock', 20, 'received'),
    ('2026-01-23'::text, 888888888, 666666666, 5678901234567, 'Low stock replenishment', 50, 'received'),
    ('2026-01-23'::text, 999999999, 123456789, 6789012345678, 'Seasonal demand', 30, 'in_transit'),
    ('2026-01-22'::text, 999999999, 123456789, 123456789012, 'Low stock replenishment', 46, 'received'),
    ('2026-01-21'::text, 999999999, 846546546, 1234567890123, 'Restock after high sales', 10, 'received'),
    ('2026-01-21'::text, 999999999, 123456789, 2345678901234, 'Initial stock allocation', 30, 'received'),
    ('2026-01-21'::text, 999999999, 111111111, 2345678901234, 'Airport kiosk restock', 15, 'received'),
    ('2026-01-21'::text, 888888888, 777777777, 8901234567890, 'New store opening stock', 20, 'received'),
    ('2026-01-21'::text, 999999999, 666666666, 1234567890123, 'City center grand opening', 5, 'in_transit'),
    ('2026-01-21'::text, 999999999, 846546546, 4567890123456, 'USB-C hub restock', 20, 'received')
) AS v(date, id_store_sent, id_store_receive, id_product, reason, quantity, status)
WHERE NOT EXISTS (
    SELECT 1 FROM transfer 
    WHERE transfer.date = v.date::date 
    AND transfer.id_store_sent = v.id_store_sent 
    AND transfer.id_store_receive = v.id_store_receive
    AND transfer.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store_sent)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store_receive)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);
