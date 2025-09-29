-- Fix hotel slug and ensure comprehensive data exists
-- This script ensures the Ibis hotel has the correct slug and all necessary data

-- First, check if hotel exists and update slug
UPDATE hotels 
SET slug = 'ibis' 
WHERE name = 'Ibis' OR name ILIKE '%ibis%';

-- If no hotel exists, create one
INSERT INTO hotels (id, name, description, logo_url, slug, owner_id, created_at, updated_at)
SELECT 
    '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
    'Ibis',
    'Welcome to our hotel store',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzMzNzNkYyIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JPC90ZXh0Pgo8L3N2Zz4K',
    'ibis',
    '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE name = 'Ibis' OR name ILIKE '%ibis%');

-- Clear existing products and stories for clean slate
DELETE FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
DELETE FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Insert comprehensive products for Ibis hotel
INSERT INTO products (id, hotel_id, name, description, image_url, price, category, created_at, updated_at) VALUES
-- Beverages
('prod-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Espresso', 'Rich and bold espresso shot', '/placeholder.svg?height=200&width=200', 3.50, 'Beverages', NOW(), NOW()),
('prod-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Cappuccino', 'Creamy cappuccino with foam art', '/placeholder.svg?height=200&width=200', 4.50, 'Beverages', NOW(), NOW()),
('prod-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Freshly squeezed orange juice', '/placeholder.svg?height=200&width=200', 5.00, 'Beverages', NOW(), NOW()),

-- Food
('prod-4', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-layer club sandwich with fries', '/placeholder.svg?height=200&width=200', 12.50, 'Food', NOW(), NOW()),
('prod-5', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', '/placeholder.svg?height=200&width=200', 9.50, 'Food', NOW(), NOW()),
('prod-6', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Grilled Chicken', 'Herb-marinated grilled chicken breast', '/placeholder.svg?height=200&width=200', 15.00, 'Food', NOW(), NOW()),

-- Pastries
('prod-7', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Croissant', 'Buttery French croissant', '/placeholder.svg?height=200&width=200', 3.00, 'Pastries', NOW(), NOW()),
('prod-8', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Pain au Chocolat', 'Chocolate-filled pastry', '/placeholder.svg?height=200&width=200', 3.50, 'Pastries', NOW(), NOW()),

-- Desserts
('prod-9', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Rich chocolate layer cake', '/placeholder.svg?height=200&width=200', 6.50, 'Desserts', NOW(), NOW()),
('prod-10', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Tiramisu', 'Classic Italian tiramisu', '/placeholder.svg?height=200&width=200', 7.00, 'Desserts', NOW(), NOW());

-- Insert engaging stories for Ibis hotel
INSERT INTO stories (id, hotel_id, media_url, media_type, caption, created_at, updated_at) VALUES
('story-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Start your day with our delicious breakfast buffet! 🌅', NOW(), NOW()),
('story-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Room service delivered fresh to your door 🚪', NOW(), NOW()),
('story-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300', 'image', 'Our chefs prepare everything with love ❤️', NOW(), NOW());

-- Verify data was inserted
SELECT 'Hotels' as table_name, COUNT(*) as count FROM hotels WHERE slug = 'ibis'
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Stories' as table_name, COUNT(*) as count FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
