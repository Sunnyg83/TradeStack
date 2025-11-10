-- Rename nextdoor caption column to craigslist caption
ALTER TABLE ad_templates
  RENAME COLUMN nextdoor_caption TO craigslist_caption;

-- Update ad_posts platform check constraint to allow craigslist instead of nextdoor
ALTER TABLE ad_posts
  DROP CONSTRAINT IF EXISTS ad_posts_platform_check;

ALTER TABLE ad_posts
  ADD CONSTRAINT ad_posts_platform_check CHECK (platform IN ('facebook', 'instagram', 'craigslist'));

