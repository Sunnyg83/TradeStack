-- ============================================
-- PLAID BANK ACCOUNTS - Bank Account Connections
-- ============================================
-- Run this after 04_stripe_connect.sql (or 03_invoicing.sql if not using Stripe Connect)
-- This adds: Plaid bank account connections for direct bank transfers

-- Add Plaid fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plaid_access_token TEXT,
ADD COLUMN IF NOT EXISTS plaid_item_id TEXT,
ADD COLUMN IF NOT EXISTS bank_account_id TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_mask TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT, -- Encrypted bank account number for payouts
ADD COLUMN IF NOT EXISTS bank_routing_number TEXT, -- Bank routing number for payouts
ADD COLUMN IF NOT EXISTS plaid_account_status TEXT DEFAULT 'pending' CHECK (plaid_account_status IN ('pending', 'connected', 'error'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plaid_item_id ON profiles(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plaid_access_token ON profiles(plaid_access_token);

-- Add comments
COMMENT ON COLUMN profiles.plaid_access_token IS 'Plaid access token for bank account API access';
COMMENT ON COLUMN profiles.plaid_item_id IS 'Plaid item ID for the connected bank account';
COMMENT ON COLUMN profiles.bank_account_id IS 'Selected bank account ID for receiving payments';
COMMENT ON COLUMN profiles.bank_account_name IS 'Bank account name/nickname';
COMMENT ON COLUMN profiles.bank_account_mask IS 'Last 4 digits of bank account';
COMMENT ON COLUMN profiles.bank_account_type IS 'Account type (checking, savings, etc.)';
COMMENT ON COLUMN profiles.bank_account_number IS 'Bank account number (encrypted) for Stripe payouts';
COMMENT ON COLUMN profiles.bank_routing_number IS 'Bank routing number for Stripe payouts';
COMMENT ON COLUMN profiles.plaid_account_status IS 'Status of Plaid bank account connection';

