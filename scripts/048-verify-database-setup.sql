-- Comprehensive database verification and final setup
-- This script verifies all tables exist and have proper data

-- Check if all required tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hotels') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as hotels_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as products_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as stories_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as orders_table;

-- Verify hotel data exists with proper slug
SELECT 
    'Hotel Data' as check_type,
    COUNT(*) as count,
    STRING_AGG(name || ' (slug: ' || COALESCE(slug, 'NULL') || ')', ', ') as details
FROM hotels 
WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Verify products exist for the hotel
SELECT 
    'Products Data' as check_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM products 
WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Verify stories exist for the hotel
SELECT 
    'Stories Data' as check_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT media_type, ', ') as media_types
FROM stories 
WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- If products table is missing, create it
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    in_stock BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    rating NUMERIC(3,2) DEFAULT 4.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- If stories table is missing, create it
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    caption TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Ensure the hotel exists with proper data
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

-- Clear and insert fresh products data
DELETE FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

INSERT INTO products (id, hotel_id, name, description, price, image_url, category, in_stock, is_active, created_at, updated_at) VALUES
-- Beverages
('prod-bev-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Premium Coffee', 'Freshly brewed artisan coffee blend', 4.50, '/placeholder.svg?height=200&width=200&text=Coffee', 'Beverages', true, true, NOW(), NOW()),
('prod-bev-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Squeezed daily from premium oranges', 3.75, '/placeholder.svg?height=200&width=200&text=Orange+Juice', 'Beverages', true, true, NOW(), NOW()),
('prod-bev-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Green Tea', 'Organic green tea with antioxidants', 3.25, '/placeholder.svg?height=200&width=200&text=Green+Tea', 'Beverages', true, true, NOW(), NOW()),

-- Food
('prod-food-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-layer sandwich with premium ingredients', 12.95, '/placeholder.svg?height=200&width=200&text=Club+Sandwich', 'Food', true, true, NOW(), NOW()),
('prod-food-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with parmesan and croutons', 9.50, '/placeholder.svg?height=200&width=200&text=Caesar+Salad', 'Food', true, true, NOW(), NOW()),
('prod-food-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Grilled Chicken Wrap', 'Tender grilled chicken with fresh vegetables', 11.25, '/placeholder.svg?height=200&width=200&text=Chicken+Wrap', 'Food', true, true, NOW(), NOW()),

-- Pastries
('prod-past-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Croissant', 'Buttery croissant filled with rich chocolate', 3.95, '/placeholder.svg?height=200&width=200&text=Croissant', 'Pastries', true, true, NOW(), NOW()),
('prod-past-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Blueberry Muffin', 'Fresh baked muffin with wild blueberries', 2.75, '/placeholder.svg?height=200&width=200&text=Muffin', 'Pastries', true, true, NOW(), NOW()),

-- Desserts
('prod-dess-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 6.50, '/placeholder.svg?height=200&width=200&text=Tiramisu', 'Desserts', true, true, NOW(), NOW()),
('prod-dess-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Rich chocolate cake with ganache frosting', 5.95, '/placeholder.svg?height=200&width=200&text=Chocolate+Cake', 'Desserts', true, true, NOW(), NOW());

-- Clear and insert fresh stories data
DELETE FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

INSERT INTO stories (id, hotel_id, media_url, media_type, caption, is_active, created_at) VALUES
('story-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300&text=Welcome+Story', 'image', 'Welcome to our modern lobby - your comfort is our priority', true, NOW()),
('story-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300&text=Chef+Story', 'image', 'Enjoy fresh meals prepared by our expert chefs', true, NOW()),
('story-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', '/placeholder.svg?height=400&width=300&text=Room+Service', 'image', 'Order directly to your room with our convenient service', true, NOW());

-- Final verification
SELECT 'FINAL VERIFICATION' as status;
SELECT 'Hotels' as table_name, COUNT(*) as count FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Stories' as table_name, COUNT(*) as count FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Show sample data
SELECT 'Sample Products' as data_type, name, category, price FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' LIMIT 5;
SELECT 'Sample Stories' as data_type, caption, media_type FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' LIMIT 3;
