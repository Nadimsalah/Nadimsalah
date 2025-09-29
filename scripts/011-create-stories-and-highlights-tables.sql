-- Create Stories and Highlights system for hotels
-- This enables Instagram-like stories functionality with highlights

-- Stories table - stores individual story content
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    duration INTEGER DEFAULT 15, -- Duration in seconds for display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Highlights table - stores persistent story collections
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    cover_image TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Junction table linking stories to highlights
CREATE TABLE IF NOT EXISTS story_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    UNIQUE(story_id, highlight_id)
);

-- Story views tracking (optional for analytics)
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_ip INET,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_hotel_id ON stories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_highlights_hotel_id ON highlights(hotel_id);
CREATE INDEX IF NOT EXISTS idx_highlights_active ON highlights(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_highlights_sort_order ON highlights(sort_order);

CREATE INDEX IF NOT EXISTS idx_story_highlights_story_id ON story_highlights(story_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_highlight_id ON story_highlights(highlight_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_sort_order ON story_highlights(sort_order);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- Insert default highlight categories for hotels
INSERT INTO highlights (hotel_id, title, description, sort_order) 
SELECT 
    h.id,
    'Welcome',
    'Welcome to our hotel - first impressions and greetings',
    1
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM highlights hl WHERE hl.hotel_id = h.id AND hl.title = 'Welcome'
);

INSERT INTO highlights (hotel_id, title, description, sort_order) 
SELECT 
    h.id,
    'Rooms',
    'Showcase our beautiful rooms and accommodations',
    2
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM highlights hl WHERE hl.hotel_id = h.id AND hl.title = 'Rooms'
);

INSERT INTO highlights (hotel_id, title, description, sort_order) 
SELECT 
    h.id,
    'Dining',
    'Delicious food and dining experiences',
    3
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM highlights hl WHERE hl.hotel_id = h.id AND hl.title = 'Dining'
);

INSERT INTO highlights (hotel_id, title, description, sort_order) 
SELECT 
    h.id,
    'Amenities',
    'Hotel facilities and amenities',
    4
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM highlights hl WHERE hl.hotel_id = h.id AND hl.title = 'Amenities'
);

-- Function to automatically clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    -- Mark expired stories as inactive instead of deleting them
    UPDATE stories 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
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
