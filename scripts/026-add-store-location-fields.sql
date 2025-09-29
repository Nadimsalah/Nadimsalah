-- Add owner number, currency, country, and city fields to hotels table
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS owner_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Update existing hotels with default currency if not set
UPDATE hotels SET currency = 'USD' WHERE currency IS NULL;
