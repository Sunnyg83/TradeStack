# 🛠️ Fix Your Login Issues

## 🔍 What We Found:

1. ❌ **Stale Cookie Data** - Your browser has corrupted Supabase cookies
2. ❌ **RLS Blocking Profile Access** - Database security is rejecting the profile lookup (406 error)

---

## ✅ **Step 1: Clear Your Cookies**

### Option A: Use the Clear Cookies Page (Easiest)
1. Go to: **http://localhost:3000/clear-cookies**
2. Click "🗑️ Clear Everything"
3. You'll be redirected to login

### Option B: Manually Clear in Browser
1. Press **F12** (open DevTools)
2. Go to **Application** tab
3. Left side: **Cookies** → `http://localhost:3000`
4. Delete all cookies starting with `sb-`
5. Refresh the page

---

## ✅ **Step 2: Fix Database RLS**

1. **Go to Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. **Copy and paste this:**

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

5. Click **Run** (or press Ctrl+Enter)
6. Should see: "Success. No rows returned"

---

## ✅ **Step 3: Test Again**

1. Go to: **http://localhost:3000/login**
2. Sign in with: `sgandhari06@gmail.com`
3. Should redirect to **/onboarding** (if no profile) or **/dashboard** (if you have a profile)

---

## 🧪 **Test Pages Available:**

- **http://localhost:3000/test-login** - Test login without redirect
- **http://localhost:3000/test-auth** - Check auth status
- **http://localhost:3000/clear-cookies** - Clear all cookies

---

## 📋 **What Should Happen:**

1. Clear cookies ✅
2. Run SQL to disable RLS ✅
3. Login → redirects to onboarding (new user) or dashboard (existing user) ✅

---

## 🐛 **Still Not Working?**

If you still get errors, open console (F12) and send me:
1. All the `[Login]` messages
2. Any red error messages
3. The Network tab showing the failed request

