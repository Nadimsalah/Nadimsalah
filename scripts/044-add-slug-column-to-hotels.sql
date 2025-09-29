-- Fix Hotels database table by adding missing "slug" column
-- This resolves 500 internal server errors caused by missing slug column

-- Step 1: Add slug column as nullable initially
ALTER TABLE hotels 
ADD COLUMN slug VARCHAR(255);

-- Step 2: Create a function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRIM(input_text), 
                '[^a-zA-Z0-9\s-]', '', 'g'
            ), 
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate slugs for existing hotels based on hotel names
UPDATE hotels 
SET slug = generate_slug(name) 
WHERE slug IS NULL;

-- Step 4: Handle potential duplicates by adding numbers
WITH numbered_hotels AS (
    SELECT id, slug, 
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM hotels
)
UPDATE hotels 
SET slug = CASE 
    WHEN numbered_hotels.rn = 1 THEN numbered_hotels.slug
    ELSE numbered_hotels.slug || '-' || numbered_hotels.rn
END
FROM numbered_hotels 
WHERE hotels.id = numbered_hotels.id 
AND numbered_hotels.rn > 1;

-- Step 5: Make slug column unique and not null
ALTER TABLE hotels 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE hotels 
ADD CONSTRAINT hotels_slug_unique UNIQUE (slug);

-- Step 6: Create index for better performance
CREATE INDEX idx_hotels_slug ON hotels(slug);

-- Step 7: Insert sample hotel data if table is empty
INSERT INTO hotels (id, name, description, logo_url, contact_number, address, owner_id, slug, created_at, updated_at)
SELECT 
    '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
    'Ibis Hotel',
    'Modern hotel with excellent service and comfortable accommodations',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA3N0JFIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkliaXM8L3RleHQ+Cjwvc3ZnPg==',
    '+1-555-0123',
    '123 Hotel Street, City, State 12345',
    'd894a925-f367-487a-9b1f-76dd476be21c',
    'ibis-hotel',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a');

-- Step 8: Insert sample products for the hotel
INSERT INTO products (id, hotel_id, name, description, price, image_url, category, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
    'Cappuccino',
    'Rich and creamy cappuccino made with premium coffee beans',
    4.50,
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOEI0NTEzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2FwcHVjY2lubzwvdGV4dD4KPC9zdmc+',
    'beverages',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' AND name = 'Cappuccino')

UNION ALL

SELECT 
    gen_random_uuid(),
    '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
    'Club Sandwich',
    'Triple-decker sandwich with turkey, bacon, lettuce, and tomato',
    12.99,
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkY4QzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2x1YiBTYW5kd2ljaDwvdGV4dD4KPC9zdmc+',
    'food',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a' AND name = 'Club Sandwich');

-- Step 9: Clean up the helper function
DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- Verify the changes
SELECT 'Hotels table updated successfully' as status;
SELECT COUNT(*) as hotel_count FROM hotels;
SELECT COUNT(*) as product_count FROM products;
