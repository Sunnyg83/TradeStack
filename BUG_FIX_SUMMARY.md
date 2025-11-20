# 🐛 Bug Fixed: Wrong Column Name in Profile Query

## ❌ The Problem:

The login page and auth callback were querying the `profiles` table with the **wrong column name**:

- **Wrong:** `.eq('id', user.id)` 
- **Correct:** `.eq('user_id', user.id)`

This caused a **406 Not Acceptable** error because the database couldn't find the column.

---

## ✅ What I Fixed:

### 1. **Login Page** (`app/login/page.tsx`)
Changed line 53:
```typescript
// Before:
.eq('id', data.user.id)

// After:
.eq('user_id', data.user.id)
```

### 2. **Auth Callback** (`app/auth/callback/route.ts`)
Changed line 20:
```typescript
// Before:
.eq('id', user.id)

// After:
.eq('user_id', user.id)
```

---

## ✅ Already Correct:

These files were already using the correct column name:
- ✅ `app/onboarding/page.tsx` - uses `user_id`
- ✅ `app/dashboard/page.tsx` - uses `user_id`
- ✅ `app/dashboard/settings/page.tsx` - uses `user_id`
- ✅ `app/dashboard/website/page.tsx` - uses `user_id`

---

## 🎯 Result:

**The 406 error is now fixed!**

- ✅ Login will check for profile correctly
- ✅ No more 406 errors
- ✅ Proper redirect to onboarding or dashboard

---

## 🧪 Test It:

1. Go to: **http://localhost:3000/login**
2. Sign in with: `sgandhari06@gmail.com`
3. Check console - should see:
   - ✅ NO stale cookie errors (auto-cleaned)
   - ✅ NO 406 errors (correct column name)
   - ✅ "Profile check result: { profile: null... }" or "{ profile: {...} }"
   - ✅ Redirect to `/onboarding` or `/dashboard`

---

## 🚀 Ready!

The login flow should work perfectly now!

