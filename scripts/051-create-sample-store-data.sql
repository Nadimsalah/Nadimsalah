-- Create sample products and stories data for the hotel store
-- This will enable users to browse products and place orders

-- First, let's ensure we have the hotel data
INSERT INTO hotels (id, name, description, slug, logo_url, owner_id, created_at, updated_at)
VALUES (
  '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
  'Ibis',
  'Modern hotel with excellent room service',
  'ibis',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwN0FGRiIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JPC90ZXh0Pgo8L3N2Zz4K',
  'd894a925-f367-487a-9b1f-76dd476be21c',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  slug = EXCLUDED.slug,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Adding comprehensive sample products across different categories
-- Delete existing products for this hotel to avoid duplicates
DELETE FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Insert sample products
INSERT INTO products (id, hotel_id, name, description, price, image_url, category, in_stock, rating, created_at, updated_at) VALUES
-- Beverages
('prod-001', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Cappuccino', 'Rich espresso with steamed milk foam', 25.00, 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', 'Beverages', true, 4.5, NOW(), NOW()),
('prod-002', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 18.00, '/placeholder.svg?height=100&width=100', 'Beverages', true, 4.3, NOW(), NOW()),
('prod-003', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Moroccan Mint Tea', 'Traditional mint tea with fresh herbs', 15.00, '/placeholder.svg?height=100&width=100', 'Beverages', true, 4.7, NOW(), NOW()),

-- Food
('prod-004', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-layer sandwich with chicken, bacon, and vegetables', 45.00, '/placeholder.svg?height=100&width=100', 'Food', true, 4.4, NOW(), NOW()),
('prod-005', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with Caesar dressing and croutons', 35.00, '/placeholder.svg?height=100&width=100', 'Food', true, 4.2, NOW(), NOW()),
('prod-006', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Grilled Chicken', 'Tender grilled chicken breast with herbs', 55.00, '/placeholder.svg?height=100&width=100', 'Food', true, 4.6, NOW(), NOW()),

-- Pastries
('prod-007', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Croissant', 'Buttery, flaky French croissant', 12.00, '/placeholder.svg?height=100&width=100', 'Pastries', true, 4.1, NOW(), NOW()),
('prod-008', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Pain au Chocolat', 'Croissant filled with rich dark chocolate', 15.00, '/placeholder.svg?height=100&width=100', 'Pastries', true, 4.5, NOW(), NOW()),

-- Desserts
('prod-009', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Rich chocolate cake with ganache', 28.00, '/placeholder.svg?height=100&width=100', 'Desserts', true, 4.8, NOW(), NOW()),
('prod-010', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fruit Tart', 'Fresh seasonal fruits on pastry cream', 22.00, '/placeholder.svg?height=100&width=100', 'Desserts', true, 4.3, NOW(), NOW());

-- Adding sample stories to make the store more engaging
-- Delete existing stories for this hotel to avoid duplicates
DELETE FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Insert sample stories
INSERT INTO stories (id, hotel_id, media_url, media_type, caption, created_at, is_active, expires_at, view_count) VALUES
('story-001', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image/jpeg', 'Fresh breakfast delivered to your room', NOW(), true, NOW() + INTERVAL '24 hours', 0),
('story-002', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image/jpeg', 'Our barista preparing your perfect cappuccino', NOW(), true, NOW() + INTERVAL '24 hours', 0),
('story-003', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image/jpeg', 'Behind the scenes in our kitchen', NOW(), true, NOW() + INTERVAL '24 hours', 0);

-- Add missing column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update all products to be active
UPDATE products SET is_active = true WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Verification queries
SELECT 'Hotels' as table_name, COUNT(*) as count FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Stories' as table_name, COUNT(*) as count FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Show sample data
SELECT 'Sample Products:' as info;
SELECT name, category, price, in_stock FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' ORDER BY category, name;

SELECT 'Sample Stories:' as info;
SELECT caption, media_type FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
