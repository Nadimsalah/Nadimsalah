-- Add contact number and social media fields to hotels table
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotels_contact_number ON hotels(contact_number);
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);

-- Update existing hotels with default values if needed
UPDATE hotels 
SET contact_number = NULL, 
    address = NULL,
    facebook_url = NULL,
    instagram_url = NULL,
    twitter_url = NULL,
    linkedin_url = NULL
WHERE contact_number IS NULL;
