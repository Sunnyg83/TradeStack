# How to Find Your Supabase Credentials

## Step-by-Step Guide

### 1. Log into Supabase
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Log in with your account

### 2. Select Your Project
- You should see your project "TradeStack" (or whatever you named it)
- Click on it to open the project dashboard

### 3. Find Settings
- Look at the **left sidebar** (vertical menu on the left side)
- Scroll down and click on **"Settings"** (it has a gear icon ⚙️)

### 4. Go to API Settings
- In the Settings menu, you'll see several options:
  - General
  - API ← **CLICK THIS ONE**
  - Database
  - Auth
  - Storage
  - etc.
- Click on **"API"**

### 5. Find Your Credentials

On the API page, you'll see several sections:

#### Section 1: "Project URL"
- At the top, you'll see **"Project URL"**
- It looks like: `https://xxxxx.supabase.co`
- **Copy this** → This is your `NEXT_PUBLIC_SUPABASE_URL`

#### Section 2: "Project API keys"
- Scroll down a bit
- You'll see **"Project API keys"** section
- There are two keys here:

  **a) anon public key**
  - This is the one you already have!
  - It starts with `eyJ...`
  - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  **b) service_role key** ⚠️
  - Click the "Reveal" button next to it (or eye icon)
  - Copy this key
  - This is your `SUPABASE_SERVICE_ROLE_KEY`
  - **Keep this secret!** Don't share it publicly.

---

## Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   ├── Table Editor
│   ├── SQL Editor
│   ├── Authentication
│   ├── Storage
│   └── Settings ⚙️ ← CLICK HERE
│       ├── General
│       ├── API ← THEN CLICK HERE
│       ├── Database
│       └── ...
│
└── API Settings Page shows:
    ├── Project URL: https://xxxxx.supabase.co
    └── Project API keys:
        ├── anon public: eyJ... (you have this)
        └── service_role: eyJ... (click "Reveal" to see)
```

---

## Quick Path
1. Dashboard → Your Project
2. Left Sidebar → **Settings** (gear icon)
3. Settings → **API**
4. Copy:
   - Project URL (top of page)
   - service_role key (scroll down, click "Reveal")

---

## Your Current Values

Based on your anon key, your project URL is:
```
https://pygfjqbwvnijbrfcdceg.supabase.co
```

This is already in your `.env.local` file!

You just need to get the **service_role key** from the same API settings page.

