-- Add suggestion_quantity column to stock table
-- This column stores the suggested transfer quantity for each stock item

ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS suggestion_quantity INTEGER;

COMMENT ON COLUMN stock.suggestion_quantity IS 'Suggested quantity for transfer based on transfer suggestions';
