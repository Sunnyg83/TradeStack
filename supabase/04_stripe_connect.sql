-- ============================================
-- STRIPE CONNECT - Multi-User Payments
-- ============================================
-- Run this after 03_invoicing.sql
-- This adds: Stripe Connect support for multi-user payments

-- Add stripe_account_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending' CHECK (stripe_account_status IN ('pending', 'active', 'restricted', 'rejected'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);

-- Add comment
COMMENT ON COLUMN profiles.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN profiles.stripe_account_status IS 'Status of Stripe Connect account (pending, active, restricted, rejected)';

