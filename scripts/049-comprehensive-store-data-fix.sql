-- Comprehensive Store Data Fix
-- This script ensures all necessary data exists for the hotel store to function properly

-- First, ensure the Ibis hotel exists with proper slug
INSERT INTO hotels (id, name, description, logo_url, slug, owner_id, created_at, updated_at)
VALUES (
  '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a',
  'Ibis',
  'Welcome to our hotel store',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA2ADYAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAADYAAAAAQAAANgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAABQqgAwAEAAAAAQAABQQAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/AABEIBQQFCgMBEQACEQEDEQH/xAAf',
  'ibis-3',
  'd894a925-f367-487a-9b1f-76dd476be21c',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  slug = 'ibis-3',
  name = 'Ibis',
  description = 'Welcome to our hotel store',
  logo_url = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA2ADYAAD/4QCMRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAADYAAAAAQAAANgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAABQqgAwAEAAAAAQAABQQAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/AABEIBQQFCgMBEQACEQEDEQH/xAAf',
  updated_at = NOW();

-- Clear existing products and stories for this hotel to avoid duplicates
DELETE FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
DELETE FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Insert comprehensive products for the Ibis hotel
INSERT INTO products (id, hotel_id, name, description, price, category, image_url, in_stock, created_at, updated_at) VALUES
-- Beverages
('prod-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Cappuccino', 'Rich espresso with steamed milk foam', 25.00, 'Beverages', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 18.00, 'Beverages', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Moroccan Mint Tea', 'Traditional mint tea with fresh herbs', 15.00, 'Beverages', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),

-- Food
('prod-4', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Club Sandwich', 'Triple-layer sandwich with chicken, bacon, and vegetables', 45.00, 'Food', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-5', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Caesar Salad', 'Fresh romaine lettuce with parmesan and croutons', 35.00, 'Food', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-6', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Grilled Chicken', 'Tender grilled chicken breast with herbs', 55.00, 'Food', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),

-- Pastries
('prod-7', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Croissant', 'Buttery French croissant', 12.00, 'Pastries', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-8', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Pain au Chocolat', 'Flaky pastry with dark chocolate', 15.00, 'Pastries', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),

-- Desserts
('prod-9', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Chocolate Cake', 'Rich chocolate cake with ganache', 28.00, 'Desserts', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW()),
('prod-10', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 32.00, 'Desserts', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', true, NOW(), NOW());

-- Insert stories for the Ibis hotel
INSERT INTO stories (id, hotel_id, media_url, media_type, caption, created_at, updated_at, view_count) VALUES
('story-1', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', 'image/webp', 'Fresh breakfast served daily', NOW(), NOW(), 0),
('story-2', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', 'image/webp', 'Premium room service experience', NOW(), NOW(), 0),
('story-3', '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a', 'data:image/webp;base64,UklGRiL4AABXRUJQVlA4WAoAAAAoAAAAWwMAPAIASUNDUKgBAAAAAAGobGNtcwIQAABtbnRyUkdCIFhZWiAH3AABABkAAwApADlhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAA', 'image/webp', 'Special evening menu available', NOW(), NOW(), 0);

-- Verify the data was inserted correctly
SELECT 'Hotels' as table_name, COUNT(*) as count FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a'
UNION ALL
SELECT 'Stories' as table_name, COUNT(*) as count FROM stories WHERE hotel_id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';

-- Show the hotel data with slug
SELECT id, name, slug, description FROM hotels WHERE id = '46dbf52a-241f-44ef-ac8e-e9c59a8cdc5a';
