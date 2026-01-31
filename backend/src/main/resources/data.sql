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

-- Insert Categories (only if table is empty)
INSERT INTO category (id, name, description)
SELECT * FROM (VALUES
    (1, 'Computers & Laptops', 'Desktop computers, laptops, and workstations'),
    (2, 'Peripherals', 'Mice, keyboards, webcams, and other input devices'),
    (3, 'Monitors & Displays', 'Computer monitors, displays, and screens'),
    (4, 'Audio Equipment', 'Headphones, speakers, and audio accessories'),
    (5, 'Storage Devices', 'External hard drives, SSDs, and storage solutions'),
    (6, 'Accessories', 'Docking stations, hubs, converters, and other accessories')
) AS v(id, name, description)
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category.id = v.id);

-- Insert Products (only if table is empty)
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

-- Insert Stock (only if table is empty)
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

-- Insert Sales (only if table is empty)
-- Using dates from the past few months
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO sales (range_date, id_store, id_product, quantity)
SELECT * FROM (VALUES
    ('2025-01-15', 846546546, 1234567890123, 2),   -- Main Store sold 2 Laptops
    ('2025-01-15', 846546546, 2345678901234, 5),   -- Main Store sold 5 Mice
    ('2025-01-16', 123456789, 1234567890123, 1),   -- Secondary Store sold 1 Laptop
    ('2025-01-16', 123456789, 4567890123456, 3),   -- Secondary Store sold 3 USB-C Hubs
    ('2025-01-17', 111111111, 2345678901234, 4),   -- Airport Kiosk sold 4 Mice
    ('2025-01-18', 846546546, 3456789012345, 2),   -- Main Store sold 2 Keyboards
    ('2025-01-19', 123456789, 5678901234567, 1),   -- Secondary Store sold 1 Monitor
    ('2025-01-20', 777777777, 8901234567890, 3),   -- Suburban Store sold 3 Headphones
    ('2025-01-21', 777777777, 9012345678901, 2),   -- Suburban Store sold 2 External SSDs
    ('2025-01-22', 666666666, 1234567890123, 1),   -- City Center sold 1 Laptop
    ('2025-01-22', 666666666, 2345678901234, 8),   -- City Center sold 8 Mice
    ('2025-01-23', 846546546, 4567890123456, 4),   -- Main Store sold 4 USB-C Hubs
    ('2025-01-24', 123456789, 6789012345678, 2),   -- Secondary Store sold 2 Webcams
    ('2025-01-25', 111111111, 6789012345678, 1),   -- Airport Kiosk sold 1 Webcam
    ('2025-01-26', 777777777, 123456789012, 1),    -- Suburban Store sold 1 Docking Station
    ('2025-01-27', 666666666, 123456789012, 5),    -- City Center sold 5 Docking Stations
    ('2025-01-28', 846546546, 5678901234567, 1),   -- Main Store sold 1 Monitor
    ('2025-01-29', 123456789, 8901234567890, 2),   -- Secondary Store sold 2 Headphones
    ('2025-01-30', 777777777, 123456789012, 3)     -- Suburban Store sold 3 Docking Stations
) AS v(range_date, id_store, id_product, quantity)
WHERE NOT EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.range_date = v.range_date::date 
    AND sales.id_store = v.id_store 
    AND sales.id_product = v.id_product
)
AND EXISTS (SELECT 1 FROM store WHERE store.id = v.id_store)
AND EXISTS (SELECT 1 FROM product WHERE product.id = v.id_product);

-- Insert Transfers (only if table is empty)
-- Warehouse to stores transfers
-- Using direct numeric IDs (ID = serial_number for stores, ID = code_barre for products)
INSERT INTO transfer (date, id_store_sent, id_store_receive, id_product, reason, quantity)
SELECT * FROM (VALUES
    ('2025-01-10', 999999999, 846546546, 1234567890123, 'Restock after high sales', 10),  -- Main Warehouse to Main Store - Laptops
    ('2025-01-11', 999999999, 123456789, 2345678901234, 'Initial stock allocation', 30),  -- Main Warehouse to Secondary Store - Mice
    ('2025-01-12', 999999999, 111111111, 2345678901234, 'Airport kiosk restock', 15),     -- Main Warehouse to Airport Kiosk - Mice
    ('2025-01-13', 888888888, 777777777, 8901234567890, 'New store opening stock', 20),   -- East Coast Distribution to Suburban Store - Headphones
    ('2025-01-14', 999999999, 666666666, 1234567890123, 'City center grand opening', 5), -- Main Warehouse to City Center - Laptops
    ('2025-01-15', 999999999, 846546546, 4567890123456, 'USB-C hub restock', 20),         -- Main Warehouse to Main Store - USB-C Hubs
    ('2025-01-16', 888888888, 123456789, 5678901234567, 'Monitor restock', 5),            -- East Coast Distribution to Secondary Store - Monitors
    ('2025-01-17', 999999999, 777777777, 9012345678901, 'External SSD restock', 10),    -- Main Warehouse to Suburban Store - External SSDs
    ('2025-01-18', 999999999, 111111111, 6789012345678, 'Webcam restock', 10),            -- Main Warehouse to Airport Kiosk - Webcams
    ('2025-01-19', 888888888, 666666666, 123456789012, 'Docking station restock', 25)      -- East Coast Distribution to City Center - Docking Stations
) AS v(date, id_store_sent, id_store_receive, id_product, reason, quantity)
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
