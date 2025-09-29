-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Update existing orders with sequential order numbers per hotel
WITH numbered_orders AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY hotel_id ORDER BY created_at) as rn
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders 
SET order_number = numbered_orders.rn
FROM numbered_orders
WHERE orders.id = numbered_orders.id;
