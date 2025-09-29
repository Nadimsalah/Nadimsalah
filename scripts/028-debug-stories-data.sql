-- Debug script to check stories data in database
-- This will help identify why stories aren't showing in hotel store

-- Check all hotels and their stories
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    h.slug as hotel_slug,
    COUNT(s.id) as total_stories,
    COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_stories,
    COUNT(CASE WHEN s.is_active = true AND s.expires_at > NOW() THEN 1 END) as valid_stories
FROM hotels h
LEFT JOIN stories s ON h.id = s.hotel_id
GROUP BY h.id, h.name, h.slug
ORDER BY h.name;

-- Check detailed stories information
SELECT 
    s.id,
    s.hotel_id,
    h.name as hotel_name,
    h.slug as hotel_slug,
    s.media_url,
    s.media_type,
    s.caption,
    s.is_active,
    s.created_at,
    s.expires_at,
    CASE 
        WHEN s.expires_at > NOW() THEN 'Valid'
        ELSE 'Expired'
    END as status,
    s.view_count
FROM stories s
JOIN hotels h ON s.hotel_id = h.id
ORDER BY s.created_at DESC;

-- Check specifically for ibis-3 hotel
SELECT 
    h.id,
    h.name,
    h.slug,
    s.*
FROM hotels h
LEFT JOIN stories s ON h.id = s.hotel_id
WHERE h.slug = 'ibis-3' 
   OR h.name ILIKE '%ibis%'
   OR h.id = 'ibis-3';
