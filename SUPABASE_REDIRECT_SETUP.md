# Supabase Email Redirect Setup for Vercel

## Problem
When users click the email confirmation link, it redirects to localhost instead of your Vercel deployment URL.

## Solution

You need to configure the redirect URLs in your Supabase dashboard:

### Step 1: Go to Supabase Dashboard
1. Log in to [supabase.com](https://supabase.com)
2. Select your TradeStack project
3. Go to **Authentication** → **URL Configuration**

### Step 2: Update Site URL
1. Find the **Site URL** field
2. Set it to your Vercel deployment URL:
   ```
   https://trade-stack.vercel.app
   ```

### Step 3: Update Redirect URLs
1. Find the **Redirect URLs** section
2. Add these URLs (one per line):
   ```
   https://trade-stack.vercel.app/onboarding
   https://trade-stack.vercel.app/**
   http://localhost:3000/onboarding
   http://localhost:3000/**
   ```
   
   **Important:** The `/**` pattern allows all routes under that domain, which is necessary for email confirmations to work properly.

### Step 4: Update Email Templates (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. Find the **Confirm signup** template
3. Check that the confirmation link uses the correct redirect URL
4. The link should look like:
   ```
   {{ .ConfirmationURL }}
   ```
   This will automatically use the redirect URL you specified in the signup function.

### Step 5: Verify Environment Variable
Make sure your Vercel environment variable is set:
```
NEXT_PUBLIC_APP_URL=https://trade-stack.vercel.app
```

### Step 6: Test
1. Sign up for a new account
2. Check your email
3. Click the confirmation link
4. It should redirect to `https://trade-stack.vercel.app/onboarding` (not localhost)

## Notes
- The `/**` wildcard is important - it allows Supabase to redirect to any route after email confirmation
- Keep localhost URLs in the redirect list for local development
- After making changes, wait a few minutes for Supabase to update the configuration
- If it still doesn't work, clear your browser cache and try again

