-- Create stories table for hotel story uploads
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL, -- Base64 encoded media data
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT, -- Base64 encoded thumbnail for videos
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_stories_hotel_id ON stories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(hotel_id, is_active, expires_at);

-- Create function to get active stories for a hotel
CREATE OR REPLACE FUNCTION get_active_stories_for_hotel(p_hotel_id TEXT)
RETURNS TABLE (
    id TEXT,
    media_url TEXT,
    media_type VARCHAR,
    thumbnail_url TEXT,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.media_url, s.media_type, s.thumbnail_url, s.caption, s.created_at, s.view_count
    FROM stories s
    WHERE s.hotel_id = p_hotel_id 
      AND s.is_active = true 
      AND s.expires_at > NOW()
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM stories 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
