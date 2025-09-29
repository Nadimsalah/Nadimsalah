-- Updated Stories and Highlights system with improved schema design
-- This enables Instagram-like stories functionality with proper foreign key constraints

-- Stories table - stores individual story content
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT, -- Added thumbnail URL for quick previews
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    duration INTEGER DEFAULT 15, -- Duration in seconds for display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    is_highlight BOOLEAN DEFAULT false, -- Added is_highlight flag as requested
    view_count INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Highlights table - stores persistent story collections
CREATE TABLE IF NOT EXISTS highlights (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    cover_image TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Junction table linking stories to highlights
CREATE TABLE IF NOT EXISTS story_highlights (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    highlight_id TEXT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    UNIQUE(story_id, highlight_id)
);

-- Story views tracking for analytics
CREATE TABLE IF NOT EXISTS story_views (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_ip INET,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    session_id TEXT -- Added session tracking for better analytics
);

-- Create indexes for efficient queries on active stories
CREATE INDEX IF NOT EXISTS idx_stories_hotel_id ON stories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stories_active_non_expired ON stories(hotel_id, is_active, expires_at) WHERE is_active = true AND expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_highlights_hotel_id ON highlights(hotel_id);
CREATE INDEX IF NOT EXISTS idx_highlights_active ON highlights(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_highlights_sort_order ON highlights(sort_order);

CREATE INDEX IF NOT EXISTS idx_story_highlights_story_id ON story_highlights(story_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_highlight_id ON story_highlights(highlight_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_sort_order ON story_highlights(sort_order);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- Function to initialize default highlights for new hotels
CREATE OR REPLACE FUNCTION initialize_hotel_highlights(hotel_id_param TEXT)
RETURNS void AS $$
BEGIN
    -- Insert default highlight categories for the new hotel
    INSERT INTO highlights (hotel_id, title, description, sort_order, cover_image) VALUES
    (hotel_id_param, 'Welcome', 'Welcome to our hotel - first impressions and greetings', 1, '/images/hotel-welcome.png'),
    (hotel_id_param, 'Rooms', 'Showcase our beautiful rooms and accommodations', 2, '/images/comfortable-hotel-room.png'),
    (hotel_id_param, 'Dining', 'Delicious food and dining experiences', 3, '/images/hotel-dining.png'),
    (hotel_id_param, 'Amenities', 'Hotel facilities and amenities', 4, '/images/hotel-spa.png');
END;
$$ LANGUAGE plpgsql;

-- Initialize highlights for existing hotels
DO $$
DECLARE
    hotel_record RECORD;
BEGIN
    FOR hotel_record IN SELECT id FROM hotels LOOP
        -- Check if hotel already has highlights
        IF NOT EXISTS (SELECT 1 FROM highlights WHERE hotel_id = hotel_record.id) THEN
            PERFORM initialize_hotel_highlights(hotel_record.id);
        END IF;
    END LOOP;
END $$;

-- Function to automatically clean up expired stories with better logic
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    -- Mark expired stories as inactive instead of deleting them for data retention
    UPDATE stories 
    SET is_active = false 
    WHERE expires_at < NOW() 
    AND is_active = true 
    AND is_highlight = false; -- Keep highlighted stories active even if expired
    
    -- Log cleanup activity
    INSERT INTO story_views (story_id, viewer_ip, user_agent, viewed_at)
    SELECT id, '127.0.0.1'::inet, 'system-cleanup', NOW()
    FROM stories 
    WHERE expires_at < NOW() AND is_active = false
    LIMIT 1; -- Just for logging purposes
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp for highlights
CREATE OR REPLACE FUNCTION update_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_highlights_updated_at
    BEFORE UPDATE ON highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_highlights_updated_at();

-- Create a function to get active stories for a hotel efficiently
CREATE OR REPLACE FUNCTION get_active_stories_for_hotel(hotel_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    media_type VARCHAR(10),
    caption TEXT,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER,
    is_highlight BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.media_url,
        s.thumbnail_url,
        s.media_type,
        s.caption,
        s.duration,
        s.created_at,
        s.expires_at,
        s.view_count,
        s.is_highlight
    FROM stories s
    WHERE s.hotel_id = hotel_id_param
    AND s.is_active = true
    AND (s.expires_at > NOW() OR s.is_highlight = true)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;
