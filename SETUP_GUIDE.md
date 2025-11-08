# TradeStack Setup Guide - Getting Your API Keys

This guide will walk you through getting all the required API keys and credentials.

## Step 1: Supabase Setup (Required)

### 1.1 Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email

### 1.2 Create a New Project
1. Click "New Project" in the Supabase dashboard
2. Choose an organization (or create one)
3. Fill in:
   - **Project Name**: TradeStack (or any name you like)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine
4. Click "Create new project"
5. Wait 2-3 minutes for the project to initialize

### 1.3 Get Your Supabase Credentials
1. Once your project is ready, go to **Settings** → **API** (left sidebar)
2. You'll see:
   - **Project URL** - Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** - Copy this (long JWT token string)
   - **service_role key** - Copy this (⚠️ Keep this secret! It's in the "Project API keys" section)

### 1.4 Set Up Your Database
1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase/schema.sql` in your project
4. Copy ALL the SQL code from that file
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - this means it worked!

**Put these in your .env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
```

---

## Step 2: Gemini Setup (Required for AI Features - FREE!)

### 2.1 Get Your Gemini API Key
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account (Gmail works)
3. Click "Create API Key"
4. Select "Create API key in new project" (or use existing)
5. Copy the key immediately (starts with `AIza...`)

**Put this in your .env.local:**
```
GEMINI_API_KEY=AIza...  (your Gemini API key)
```

**Note:** Gemini is 100% FREE with no payment method required!

---

## Step 3: Resend Setup (Optional - for Email Features)

### 3.1 Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up with email or GitHub
3. Verify your email

### 3.2 Get Your API Key
1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "TradeStack"
4. Copy the key

**Put this in your .env.local:**
```
RESEND_API_KEY=re_...  (your Resend API key)
```

**Note:** Resend is optional - the app will work without it, but email features won't work.

---

## Step 4: Final .env.local File

After getting all your keys, your `.env.local` should look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini Configuration (FREE)
GEMINI_API_KEY=your-gemini-api-key-here

# Resend Configuration (Optional)
RESEND_API_KEY=your-resend-api-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Verify Setup

1. **Save** your `.env.local` file
2. **Restart** your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```
3. **Visit** [http://localhost:3000](http://localhost:3000)
4. You should see the TradeStack homepage (not the setup page)

---

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` is in the project root (`/tradestack/.env.local`)
- Make sure you restarted the server after adding the keys
- Check that there are no spaces around the `=` sign
- Make sure keys don't have quotes around them

### Database errors
- Make sure you ran the `schema.sql` file in Supabase SQL Editor
- Check that all tables were created (you can see them in Supabase → Table Editor)

### Gemini errors
- Make sure you're signed in with a Google account
- Check that the API key is correct (starts with `AIza`)
- Verify the key is active in Google AI Studio

---

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Gemini API Keys**: https://makersuite.google.com/app/apikey
- **Resend API Keys**: https://resend.com/api-keys
- **Supabase SQL Editor**: In your project → SQL Editor

---

## Cost Estimate

- **Supabase**: Free tier includes 500MB database, 2GB bandwidth/month
- **Gemini**: FREE! No cost for development
- **Resend**: Free tier includes 3,000 emails/month

Total cost for development: **~$0-5/month**

