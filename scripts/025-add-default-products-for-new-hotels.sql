-- Add default products for hotels that don't have any products
-- This helps new hotel stores have sample products to display

DO $$
DECLARE
    hotel_record RECORD;
    product_count INTEGER;
BEGIN
    -- Loop through all hotels
    FOR hotel_record IN SELECT id, name FROM hotels LOOP
        -- Check if hotel has any products
        SELECT COUNT(*) INTO product_count FROM products WHERE hotel_id = hotel_record.id;
        
        -- If no products exist, add default products
        IF product_count = 0 THEN
            INSERT INTO products (id, hotel_id, name, description, image_url, category, price, rating, in_stock, created_at, updated_at)
            VALUES 
                (gen_random_uuid(), hotel_record.id, 'Coffee', 'Fresh brewed coffee', '/placeholder.svg?height=200&width=200', 'Beverages', 5.00, 4.5, true, NOW(), NOW()),
                (gen_random_uuid(), hotel_record.id, 'Tea', 'Premium tea selection', '/placeholder.svg?height=200&width=200', 'Beverages', 3.50, 4.2, true, NOW(), NOW()),
                (gen_random_uuid(), hotel_record.id, 'Sandwich', 'Delicious club sandwich', '/placeholder.svg?height=200&width=200', 'Food', 12.00, 4.7, true, NOW(), NOW()),
                (gen_random_uuid(), hotel_record.id, 'Towels', 'Extra towels for your room', '/placeholder.svg?height=200&width=200', 'Amenities', 8.00, 4.3, true, NOW(), NOW()),
                (gen_random_uuid(), hotel_record.id, 'Snacks', 'Assorted snacks', '/placeholder.svg?height=200&width=200', 'Food', 6.50, 4.1, true, NOW(), NOW());
            
            RAISE NOTICE 'Added default products for hotel: %', hotel_record.name;
        END IF;
    END LOOP;
END $$;
