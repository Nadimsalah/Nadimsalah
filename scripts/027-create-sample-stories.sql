-- Create sample stories for testing
INSERT INTO stories (
  id,
  hotel_id,
  media_url,
  media_type,
  thumbnail_url,
  caption,
  is_active,
  created_at,
  expires_at,
  view_count
) VALUES 
-- Sample stories for Ibis Hotel (assuming hotel_id exists)
(
  gen_random_uuid()::text,
  (SELECT id FROM hotels WHERE slug = 'ibis-3' OR name ILIKE '%ibis%' LIMIT 1),
  '/hotel-welcome-story.jpg',
  'image',
  '/hotel-welcome-story.jpg',
  'Welcome to our beautiful hotel! Enjoy your stay with us.',
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  0
),
(
  gen_random_uuid()::text,
  (SELECT id FROM hotels WHERE slug = 'ibis-3' OR name ILIKE '%ibis%' LIMIT 1),
  '/hotel-room-story.jpg',
  'image',
  '/hotel-room-story.jpg',
  'Check out our luxurious rooms with amazing city views!',
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  0
),
(
  gen_random_uuid()::text,
  (SELECT id FROM hotels WHERE slug = 'ibis-3' OR name ILIKE '%ibis%' LIMIT 1),
  '/hotel-dining.jpg',
  'image',
  '/hotel-dining.jpg',
  'Delicious dining options available 24/7 for our guests.',
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  0
)
ON CONFLICT (id) DO NOTHING;

-- Create sample stories for any other hotels that might exist
INSERT INTO stories (
  id,
  hotel_id,
  media_url,
  media_type,
  thumbnail_url,
  caption,
  is_active,
  created_at,
  expires_at,
  view_count
)
SELECT 
  gen_random_uuid()::text,
  h.id,
  '/hotel-welcome-story.jpg',
  'image',
  '/hotel-welcome-story.jpg',
  'Welcome to ' || h.name || '! We hope you enjoy your stay.',
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  0
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM stories s WHERE s.hotel_id = h.id
)
LIMIT 10;
