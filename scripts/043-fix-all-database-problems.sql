-- Fix all database problems for HotelTec
-- This script adds the missing slug column to hotels table and ensures proper data

-- Add slug column to hotels table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'slug'
    ) THEN
        ALTER TABLE hotels ADD COLUMN slug VARCHAR(255) UNIQUE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);
        
        -- Update existing hotels with slugs based on their names
        UPDATE hotels 
        SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
        WHERE slug IS NULL;
        
        RAISE NOTICE 'Added slug column to hotels table and updated existing records';
    ELSE
        RAISE NOTICE 'Slug column already exists in hotels table';
    END IF;
END $$;

-- Ensure we have sample hotel data for testing
INSERT INTO hotels (id, name, description, logo_url, contact_number, address, owner_id, slug, created_at, updated_at)
VALUES 
    ('46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Ibis Hotel', 'Modern hotel with excellent service and amenities', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA3N0JFIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkliaXM8L3RleHQ+Cjwvc3ZnPg==', '+1-555-0123', '123 Hotel Street, City, State 12345', 'd894a925-f367-487a-9b1f-76dd476be21c', 'ibis-hotel', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    updated_at = NOW();

-- Ensure we have sample products for the hotel
INSERT INTO products (id, hotel_id, name, description, image_url, price, category, in_stock, rating, created_at, updated_at)
VALUES 
    ('prod-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Cappuccino', 'Rich and creamy cappuccino made with premium coffee beans', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOEI0NTEzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2FwcHVjY2lubzwvdGV4dD4KPC9zdmc+', 4.50, 'Beverages', true, 4.8, NOW(), NOW()),
    ('prod-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-decker sandwich with turkey, bacon, lettuce, and tomato', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkZENzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DbHViIFNhbmR3aWNoPC90ZXh0Pgo8L3N2Zz4=', 12.99, 'Food', true, 4.5, NOW(), NOW()),
    ('prod-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with parmesan cheese and croutons', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMjJDNTVFIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2Flc2FyIFNhbGFkPC90ZXh0Pgo8L3N2Zz4=', 9.99, 'Food', true, 4.3, NOW(), NOW()),
    ('prod-4', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkY4QzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+T3JhbmdlIEp1aWNlPC90ZXh0Pgo8L3N2Zz4=', 3.99, 'Beverages', true, 4.6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Ensure we have a test user for the hotel
INSERT INTO users (id, email, password_hash, first_name, last_name, hotel_name, role, created_at, updated_at)
VALUES 
    ('d894a925-f367-487a-9b1f-76dd476be21c', 'admin@ibishotel.com', '$2b$10$rQZ8kHp0rQZ8kHp0rQZ8kOp0rQZ8kHp0rQZ8kHp0rQZ8kHp0rQZ8k', 'Hotel', 'Admin', 'Ibis Hotel', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    hotel_name = EXCLUDED.hotel_name,
    updated_at = NOW();

-- Create some sample stories for the hotel
INSERT INTO stories (id, hotel_id, media_url, media_type, thumbnail_url, caption, is_active, view_count, expires_at, created_at)
VALUES 
    ('story-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDMwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRkY2QjM1Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KPC9zdmc+', 'image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkY2QjM1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9mZmVyPC90ZXh0Pgo8L3N2Zz4=', '20% off all beverages today!', true, 0, NOW() + INTERVAL '24 hours', NOW()),
    ('story-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDMwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMDA3N0JFIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TmV3IE1lbnU8L3RleHQ+Cjwvc3ZnPg==', 'image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA3N0JFIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1lbnU8L3RleHQ+Cjwvc3ZnPg==', 'Check out our new menu items!', true, 0, NOW() + INTERVAL '24 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the changes
SELECT 'Hotels with slugs:' as info;
SELECT id, name, slug FROM hotels WHERE slug IS NOT NULL;

SELECT 'Products count:' as info;
SELECT COUNT(*) as product_count FROM products;

SELECT 'Stories count:' as info;
SELECT COUNT(*) as story_count FROM stories;

RAISE NOTICE 'Database problems fixed successfully!';
RAISE NOTICE 'Added slug column to hotels table';
RAISE NOTICE 'Ensured sample hotel, products, and stories data exists';
RAISE NOTICE 'Hotel store system should now work properly with QR codes';
