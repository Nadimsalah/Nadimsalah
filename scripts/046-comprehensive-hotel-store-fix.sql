-- Comprehensive fix for hotel store data loading issues
-- This script ensures all hotels have proper sample data for stories, products, and categories

-- First, let's check and fix the hotels table to ensure all hotels have slugs
UPDATE hotels 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE slug IS NULL OR slug = '';

-- Ensure we have the Ibis hotel with proper data
INSERT INTO hotels (id, name, description, logo_url, slug, owner_id, created_at, updated_at)
VALUES (
  '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
  'Ibis',
  'Welcome to our hotel store - Experience comfort and convenience',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM5NTVGRiIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JPC90ZXh0Pgo8L3N2Zz4K',
  'ibis',
  'd894a925-f367-487a-9b1f-76dd476be21c',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  slug = EXCLUDED.slug,
  updated_at = NOW();

-- Clear existing products and stories for clean slate
DELETE FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
DELETE FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Add comprehensive product categories with appealing items
INSERT INTO products (id, hotel_id, name, description, price, image_url, category, available, created_at, updated_at) VALUES
-- Beverages
('prod-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Premium Coffee', 'Freshly brewed artisan coffee blend', 4.50, '/placeholder.svg?height=200&width=200', 'Beverages', true, NOW(), NOW()),
('prod-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Squeezed daily from premium oranges', 3.75, '/placeholder.svg?height=200&width=200', 'Beverages', true, NOW(), NOW()),
('prod-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Green Tea', 'Organic green tea with antioxidants', 3.25, '/placeholder.svg?height=200&width=200', 'Beverages', true, NOW(), NOW()),

-- Food
('prod-4', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-layer sandwich with premium ingredients', 12.95, '/placeholder.svg?height=200&width=200', 'Food', true, NOW(), NOW()),
('prod-5', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with parmesan and croutons', 9.50, '/placeholder.svg?height=200&width=200', 'Food', true, NOW(), NOW()),
('prod-6', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Grilled Chicken Wrap', 'Tender grilled chicken with fresh vegetables', 11.25, '/placeholder.svg?height=200&width=200', 'Food', true, NOW(), NOW()),

-- Pastries
('prod-7', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Croissant', 'Buttery croissant filled with rich chocolate', 3.95, '/placeholder.svg?height=200&width=200', 'Pastries', true, NOW(), NOW()),
('prod-8', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Blueberry Muffin', 'Fresh baked muffin with wild blueberries', 2.75, '/placeholder.svg?height=200&width=200', 'Pastries', true, NOW(), NOW()),

-- Desserts
('prod-9', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 6.50, '/placeholder.svg?height=200&width=200', 'Desserts', true, NOW(), NOW()),
('prod-10', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Rich chocolate cake with ganache frosting', 5.95, '/placeholder.svg?height=200&width=200', 'Desserts', true, NOW(), NOW());

-- Add engaging hotel stories
INSERT INTO stories (id, hotel_id, media_url, media_type, caption, created_at, updated_at) VALUES
('story-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Welcome to our modern lobby - your comfort is our priority', NOW(), NOW()),
('story-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Enjoy fresh meals prepared by our expert chefs', NOW(), NOW()),
('story-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Order directly to your room with our convenient service', NOW(), NOW());

-- Verify the data was inserted correctly
SELECT 'Hotels' as table_name, COUNT(*) as count FROM hotels WHERE slug = 'ibis'
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Stories' as table_name, COUNT(*) as count FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
