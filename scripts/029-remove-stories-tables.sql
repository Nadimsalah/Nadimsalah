-- Remove all stories-related database tables and data
-- Drop stories table and all related data
DROP TABLE IF EXISTS stories CASCADE;

-- Drop highlights table if it exists (related to stories)
DROP TABLE IF EXISTS highlights CASCADE;

-- Remove any stories-related columns from hotels table
ALTER TABLE hotels DROP COLUMN IF EXISTS stories_count;
ALTER TABLE hotels DROP COLUMN IF EXISTS has_stories;

-- Clean up any orphaned data or references
-- This ensures complete removal of stories functionality
