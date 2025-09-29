-- Add video_url column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN products.video_url IS 'Optional video URL for product demonstration or showcase';
