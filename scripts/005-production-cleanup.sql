-- Production Cleanup Script
-- Use this to clean up test data while keeping the schema intact

-- Clear test orders
DELETE FROM orders WHERE guest_name LIKE '%Test%' OR guest_name LIKE '%Demo%';

-- Reset order sequence for clean production IDs
-- (PostgreSQL will handle UUID generation automatically)

-- Update product stock status
UPDATE products SET in_stock = true WHERE in_stock = false;

-- Clean up any incomplete user registrations (optional)
DELETE FROM users WHERE 
  created_at < NOW() - INTERVAL '7 days' 
  AND (first_name IS NULL OR first_name = '');

-- Reset any demo hotel data if needed
UPDATE hotels SET 
  name = 'Your Hotel Name',
  description = 'Update your hotel description in settings'
WHERE name = 'Grand Hotel Boutique';
