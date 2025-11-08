-- Migration: Update leads table to use 'completed' instead of 'won' and add income tracking
-- Run this migration script in your Supabase SQL editor

-- Step 1: Add new columns for income tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS income_amount DECIMAL(10, 2);

-- Step 2: Update existing 'won' statuses to 'completed'
UPDATE leads SET status = 'completed' WHERE status = 'won';

-- Step 3: Drop the old constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Step 4: Add the new constraint with 'completed' instead of 'won'
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'completed', 'lost'));

-- Step 5: Add index for service_id
CREATE INDEX IF NOT EXISTS idx_leads_service_id ON leads(service_id);

-- Step 6: Add index for income queries
CREATE INDEX IF NOT EXISTS idx_leads_completed ON leads(user_id, status) WHERE status = 'completed';

