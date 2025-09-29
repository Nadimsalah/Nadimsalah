-- Create sample hotel data for testing the store
-- First, check if ibis-3 hotel exists, if not create it

INSERT INTO hotels (id, name, slug, description, logo_url, address, contact_number, owner_id, created_at, updated_at)
VALUES (
  'hotel-ibis-3-id',
  'Ibis Hotel',
  'ibis-3',
  'Modern comfort hotel with excellent amenities and room service',
  '/placeholder.svg?height=100&width=100&text=Ibis',
  '123 Main Street, City Center',
  '+1-555-0123',
  'owner-ibis-3',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create sample products for the hotel
INSERT INTO products (id, hotel_id, name, description, price, image_url, category, rating, in_stock, created_at, updated_at)
VALUES 
  (
    'prod-ibis-coffee',
    'hotel-ibis-3-id',
    'Premium Coffee',
    'Freshly brewed premium coffee delivered to your room',
    8.99,
    '/placeholder.svg?height=300&width=300&text=Coffee',
    'Beverages',
    4.5,
    true,
    NOW(),
    NOW()
  ),
  (
    'prod-ibis-sandwich',
    'hotel-ibis-3-id',
    'Club Sandwich',
    'Triple-decker club sandwich with turkey, bacon, lettuce and tomato',
    15.99,
    '/placeholder.svg?height=300&width=300&text=Sandwich',
    'Food',
    4.2,
    true,
    NOW(),
    NOW()
  ),
  (
    'prod-ibis-towels',
    'hotel-ibis-3-id',
    'Extra Towels',
    'Fresh, clean towels delivered to your room',
    5.00,
    '/placeholder.svg?height=300&width=300&text=Towels',
    'Amenities',
    4.8,
    true,
    NOW(),
    NOW()
  ),
  (
    'prod-ibis-wine',
    'hotel-ibis-3-id',
    'House Wine',
    'Selection of red or white house wine',
    25.00,
    '/placeholder.svg?height=300&width=300&text=Wine',
    'Beverages',
    4.0,
    true,
    NOW(),
    NOW()
  ),
  (
    'prod-ibis-snacks',
    'hotel-ibis-3-id',
    'Snack Basket',
    'Assorted nuts, chips, and chocolates',
    12.50,
    '/placeholder.svg?height=300&width=300&text=Snacks',
    'Food',
    4.3,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  updated_at = NOW();

-- Verify the data was inserted
SELECT 'Hotel created:' as info, name, slug FROM hotels WHERE slug = 'ibis-3';
SELECT 'Products created:' as info, COUNT(*) as product_count FROM products WHERE hotel_id = 'hotel-ibis-3-id';
