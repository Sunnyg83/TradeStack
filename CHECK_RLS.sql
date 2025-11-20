-- Check if RLS is enabled or disabled on your tables
-- Run this in Supabase SQL Editor to see the current status

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('profiles', 'services', 'leads', 'settings')
ORDER BY tablename;

-- If "RLS Enabled" shows 't' (true), then RLS is still ON
-- If it shows 'f' (false), then RLS is OFF (correct)

