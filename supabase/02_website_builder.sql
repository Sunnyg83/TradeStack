-- ============================================
-- WEBSITE BUILDER TAB
-- ============================================
-- Run this after 01_base_schema.sql
-- This adds: Website Settings, Website Pages

-- ============================================
-- TABLES - Website Builder
-- ============================================

-- Website settings table (for personal website builder)
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  website_slug TEXT UNIQUE,
  theme_name TEXT DEFAULT 'default',
  primary_color TEXT DEFAULT '#1e3a8a',
  secondary_color TEXT DEFAULT '#3b82f6',
  font_family TEXT DEFAULT 'Inter',
  is_published BOOLEAN DEFAULT false,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Website pages table
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  is_homepage BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, slug)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - ENABLE
-- ============================================

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PRIVATE (User Owned Data)
-- ============================================

-- Website settings policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own website settings" ON website_settings;
CREATE POLICY "Users can manage their own website settings" ON website_settings FOR ALL USING (auth.uid() = user_id);

-- Website pages policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own website pages" ON website_pages;
CREATE POLICY "Users can manage their own website pages" ON website_pages FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PUBLIC (Readable by Anyone)
-- ============================================

-- Website settings policies (PUBLIC - published websites are viewable)
DROP POLICY IF EXISTS "Public website settings are viewable" ON website_settings;
CREATE POLICY "Public website settings are viewable" ON website_settings FOR SELECT USING (is_published = true);

-- Website pages policies (PUBLIC - published pages are viewable)
DROP POLICY IF EXISTS "Public website pages are viewable" ON website_pages;
CREATE POLICY "Public website pages are viewable" ON website_pages FOR SELECT USING (is_published = true);

-- ============================================
-- INDEXES - Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_website_settings_user_id ON website_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_slug ON website_settings(website_slug);
CREATE INDEX IF NOT EXISTS idx_website_pages_user_id ON website_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_slug ON website_pages(user_id, slug);

-- ============================================
-- TRIGGERS - Auto-update timestamps
-- ============================================

DROP TRIGGER IF EXISTS update_website_settings_updated_at ON website_settings;
CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON website_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_pages_updated_at ON website_pages;
CREATE TRIGGER update_website_pages_updated_at BEFORE UPDATE ON website_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

