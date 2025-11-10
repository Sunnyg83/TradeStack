-- Social Media Integrations Table
-- Stores Facebook/Instagram access tokens and connection status

CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  access_token TEXT NOT NULL,
  page_id TEXT, -- Facebook Page ID (required for posting)
  page_name TEXT, -- Facebook Page Name
  instagram_account_id TEXT, -- Instagram Business Account ID
  instagram_username TEXT, -- Instagram username
  expires_at TIMESTAMP WITH TIME ZONE, -- Token expiration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, platform)
);

-- Ad Posts Table
-- Tracks which ads were posted to which platforms

CREATE TABLE IF NOT EXISTS ad_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_template_id UUID REFERENCES ad_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'craigslist')),
  post_id TEXT, -- Platform-specific post ID (e.g., Facebook post ID)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_user_id ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_ad_posts_ad_template_id ON ad_posts(ad_template_id);
CREATE INDEX IF NOT EXISTS idx_ad_posts_user_id ON ad_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_posts_platform ON ad_posts(platform);

-- RLS Policies
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_posts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own social media accounts
CREATE POLICY "Users can view their own social media accounts"
  ON social_media_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social media accounts"
  ON social_media_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social media accounts"
  ON social_media_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media accounts"
  ON social_media_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only access their own ad posts
CREATE POLICY "Users can view their own ad posts"
  ON ad_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad posts"
  ON ad_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad posts"
  ON ad_posts FOR UPDATE
  USING (auth.uid() = user_id);

