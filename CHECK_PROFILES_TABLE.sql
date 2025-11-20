-- Check the structure of the profiles table
-- Run this in Supabase SQL Editor to see what columns exist

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Also check if there are any rows in the table
SELECT COUNT(*) as total_profiles FROM profiles;

-- Show a sample row (if any exist)
SELECT * FROM profiles LIMIT 1;

