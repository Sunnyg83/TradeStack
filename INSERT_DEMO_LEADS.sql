-- Insert demo leads for sgandhari06@gmail.com
-- Run this in Supabase SQL Editor

-- First, make sure RLS is disabled
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Insert demo leads using your user_id
INSERT INTO leads (user_id, name, email, phone, service_requested, message, status, created_at)
SELECT 
  au.id as user_id,
  lead.name,
  lead.email,
  lead.phone,
  lead.service_requested,
  lead.message,
  lead.status,
  lead.created_at
FROM auth.users au
CROSS JOIN (
  VALUES
    ('Mike Chen', 'mike.chen@email.com', '(555) 234-5678', 'HVAC Installation', 'Looking to install a new AC unit in my home. Can you provide a quote?', 'new', NOW() - INTERVAL '2 hours'),
    ('Emily Rodriguez', 'emily.rodriguez@email.com', '(555) 345-6789', 'Electrical Work', 'Need to install some new outlets in the living room. When are you available?', 'contacted', NOW() - INTERVAL '1 day'),
    ('David Thompson', 'david.thompson@email.com', '(555) 456-7890', 'Power Washing', 'Looking to power wash my driveway and deck. What are your rates?', 'new', NOW() - INTERVAL '3 hours'),
    ('Jessica Martinez', 'jessica.martinez@email.com', '(555) 567-8901', 'Plumbing Repair', 'Bathroom sink is clogged. Need someone to come out ASAP.', 'completed', NOW() - INTERVAL '5 days'),
    ('Robert Johnson', 'robert.j@email.com', '(555) 678-9012', 'Drain Cleaning', 'Kitchen drain is backing up. Need help today if possible.', 'new', NOW() - INTERVAL '30 minutes'),
    ('Sarah Williams', 'sarah.w@email.com', '(555) 789-0123', 'Water Heater Repair', 'Water heater making strange noises. How soon can you come take a look?', 'quoted', NOW() - INTERVAL '2 days'),
    ('James Davis', 'james.davis@email.com', '(555) 890-1234', 'Pipe Repair', 'Noticed a small leak under the kitchen sink. Need repair estimate.', 'new', NOW() - INTERVAL '6 hours'),
    ('Lisa Anderson', 'lisa.anderson@email.com', '(555) 901-2345', 'Bathroom Remodel', 'Planning a full bathroom remodel. Would love to discuss options and pricing.', 'contacted', NOW() - INTERVAL '3 days'),
    ('Michael Brown', 'michael.b@email.com', '(555) 012-3456', 'Emergency Repair', 'Burst pipe in basement! Need emergency service ASAP!', 'completed', NOW() - INTERVAL '1 week'),
    ('Jennifer Wilson', 'jennifer.w@email.com', '(555) 123-4567', 'Faucet Installation', 'Bought a new kitchen faucet. Need help installing it. Thanks!', 'lost', NOW() - INTERVAL '4 days')
) AS lead(name, email, phone, service_requested, message, status, created_at)
WHERE au.email = 'sgandhari06@gmail.com';

-- Verify the leads were created
SELECT 
  l.name,
  l.service_requested,
  l.status,
  l.created_at
FROM leads l
JOIN auth.users au ON l.user_id = au.id
WHERE au.email = 'sgandhari06@gmail.com'
ORDER BY l.created_at DESC;

