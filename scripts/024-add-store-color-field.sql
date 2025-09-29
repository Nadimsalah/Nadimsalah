-- Add store_color field to hotels table to allow custom color selection
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS store_color VARCHAR(7) DEFAULT '#8b5cf6';

-- Update existing hotels to have the default purple color
UPDATE hotels 
SET store_color = '#8b5cf6' 
WHERE store_color IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN hotels.store_color IS 'Hex color code for hotel store branding (e.g., #8b5cf6)';
