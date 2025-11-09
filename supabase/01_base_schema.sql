-- ============================================
-- BASE SCHEMA - Core Tables and Functions
-- ============================================
-- Run this FIRST if starting from scratch
-- This includes: Profiles, Services, Leads, Settings

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES - Profiles & Authentication
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  business_name TEXT NOT NULL,
  service_area TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  slug TEXT UNIQUE NOT NULL,
  brand_color TEXT DEFAULT '#1e3a8a',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLES - Services Tab
-- ============================================

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2),
  unit TEXT DEFAULT 'service',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLES - AI CRM / Leads Tab
-- ============================================

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_requested TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'lost')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  income_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lead messages table
CREATE TABLE IF NOT EXISTS lead_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ai', 'user')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLES - Ads Tab
-- ============================================

-- Ad templates table
CREATE TABLE IF NOT EXISTS ad_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  city TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  fb_caption TEXT,
  nextdoor_caption TEXT,
  instagram_caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Outreach targets table
CREATE TABLE IF NOT EXISTS outreach_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLES - Settings Tab
-- ============================================

-- Settings table (for AI prompts and email config)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ai_prompt_template TEXT DEFAULT 'You are a friendly {trade} professional. Write a warm, professional message to a lead who inquired about {service}. Be concise and ask about their timeline.',
  email_from_name TEXT DEFAULT 'TradeStack',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - ENABLE
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PRIVATE (User Owned Data)
-- ============================================

-- Profiles policies (PRIVATE - users can only see/edit their own)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Services policies (PRIVATE - users manage their own, but PUBLIC can view active)
DROP POLICY IF EXISTS "Users can manage their own services" ON services;
CREATE POLICY "Users can manage their own services" ON services FOR ALL USING (auth.uid() = user_id);

-- Leads policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own leads" ON leads;
CREATE POLICY "Users can manage their own leads" ON leads FOR ALL USING (auth.uid() = user_id);

-- Lead messages policies (PRIVATE - users can view messages for their leads)
DROP POLICY IF EXISTS "Users can view messages for their leads" ON lead_messages;
DROP POLICY IF EXISTS "Users can insert messages for their leads" ON lead_messages;
CREATE POLICY "Users can view messages for their leads" ON lead_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_messages.lead_id AND leads.user_id = auth.uid())
);
CREATE POLICY "Users can insert messages for their leads" ON lead_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_messages.lead_id AND leads.user_id = auth.uid())
);

-- Ad templates policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own ad templates" ON ad_templates;
CREATE POLICY "Users can manage their own ad templates" ON ad_templates FOR ALL USING (auth.uid() = user_id);

-- Outreach targets policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own outreach targets" ON outreach_targets;
CREATE POLICY "Users can manage their own outreach targets" ON outreach_targets FOR ALL USING (auth.uid() = user_id);

-- Settings policies (PRIVATE - users manage their own)
DROP POLICY IF EXISTS "Users can manage their own settings" ON settings;
CREATE POLICY "Users can manage their own settings" ON settings FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PUBLIC (Readable by Anyone)
-- ============================================

-- Profiles policies (PUBLIC - profiles are viewable by everyone)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- Services policies (PUBLIC - active services are viewable by everyone)
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON services;
CREATE POLICY "Public services are viewable by everyone" ON services FOR SELECT USING (is_active = true);

-- Leads policies (PUBLIC - anyone can create a lead)
DROP POLICY IF EXISTS "Anyone can create a lead" ON leads;
CREATE POLICY "Anyone can create a lead" ON leads FOR INSERT WITH CHECK (true);

-- ============================================
-- INDEXES - Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================
-- FUNCTIONS - Utilities
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS - Auto-update timestamps
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

