-- Create sample products for testing if they don't exist
-- First, ensure we have a hotel to work with
INSERT INTO hotels (id, name, description, logo_url, slug, owner_id, created_at, updated_at)
VALUES (
  '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
  'Ibis',
  'Welcome to our hotel store',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA2ADYAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAADYAAAAAQAAANgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAABQqgAwAEAAAAAQAABQQAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/AABEIBQQFCgMBEQACEQEDEQH/xAA',
  'ibis-3',
  'd894a925-f367-487a-9b1f-76dd476be21c',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  updated_at = NOW();

-- Add sample products if they don't exist
INSERT INTO products (id, hotel_id, name, description, price, image_url, category, in_stock, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Cappuccino', 'Rich espresso with steamed milk foam', 4.50, 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', 'Beverages', true, true, NOW(), NOW()),
  (gen_random_uuid(), '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Croissant', 'Buttery, flaky French pastry', 3.25, '/placeholder.svg?height=200&width=200', 'Pastries', true, true, NOW(), NOW()),
  (gen_random_uuid(), '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with parmesan and croutons', 8.75, '/placeholder.svg?height=200&width=200', 'Food', true, true, NOW(), NOW()),
  (gen_random_uuid(), '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Decadent chocolate layer cake', 6.50, '/placeholder.svg?height=200&width=200', 'Desserts', true, true, NOW(), NOW()),
  (gen_random_uuid(), '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Green Tea', 'Premium organic green tea', 3.00, '/placeholder.svg?height=200&width=200', 'Beverages', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 'Hotels:' as table_name, COUNT(*) as count FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Products:', COUNT(*) FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' AND is_active = true;
