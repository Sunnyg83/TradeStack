# How to View Users in Supabase Database

## View Users in Supabase Dashboard

### Method 1: Authentication Users Table
1. Go to your Supabase project dashboard
2. Click on **"Authentication"** in the left sidebar
3. Click on **"Users"** 
4. You'll see all registered users with:
   - Email address
   - Created date
   - Last sign in
   - Email confirmed status
   - User ID (UUID)

### Method 2: Using SQL Editor (See All User Data)
1. Go to **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Run this SQL query to see all users:

```sql
-- View all users in auth.users table
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### Method 3: View User Profiles
To see the business profiles created by users:

```sql
-- View all profiles
SELECT 
  p.id,
  p.user_id,
  p.business_name,
  p.trade,
  p.service_area,
  p.slug,
  p.email,
  p.phone,
  u.email as user_email,
  u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

### Method 4: View Everything About a User
To see a complete view of a user including their services, leads, etc.:

```sql
-- Complete user overview
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created,
  p.business_name,
  p.trade,
  p.service_area,
  (SELECT COUNT(*) FROM services WHERE user_id = u.id) as service_count,
  (SELECT COUNT(*) FROM leads WHERE user_id = u.id) as lead_count
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;
```

## Enable Email Confirmation (Optional - for Development)

If you want to disable email confirmation for easier testing:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF
3. Click **"Save"**

⚠️ **Note:** Disable email confirmation only in development. Always enable it in production!

## See User's Leads and Services

```sql
-- View a specific user's data
-- Replace 'USER_EMAIL_HERE' with the actual email
SELECT 
  'Profile' as type,
  p.business_name,
  p.trade,
  p.service_area
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE'

UNION ALL

SELECT 
  'Service' as type,
  s.name,
  s.description,
  CAST(s.base_price AS TEXT)
FROM services s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE'

UNION ALL

SELECT 
  'Lead' as type,
  l.name,
  l.service_requested,
  l.status
FROM leads l
JOIN auth.users u ON l.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';
```

## Quick Tips

- **Table Editor**: Go to **Table Editor** → **profiles** to see all business profiles
- **Authentication**: Go to **Authentication** → **Users** to see all registered users
- **SQL Editor**: Use SQL queries for more complex queries and joins

