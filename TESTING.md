# OAuth Flow Testing Guide

## Quick Test Commands

Run all tests:
```bash
./test-oauth-flow.sh
```

Run detailed callback tests:
```bash
./test-oauth-detailed.sh
```

Run both test suites:
```bash
./test-oauth-flow.sh && ./test-oauth-detailed.sh
```

## What the Tests Check

### Basic Tests (`test-oauth-flow.sh`)
- ✅ Server is running
- ✅ Login page loads
- ✅ Signup page loads
- ✅ Callback route exists
- ✅ Callback handles missing code
- ✅ Callback handles invalid code
- ✅ Clear cookies API works
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ Environment variables configured
- ✅ Error handling works

### Detailed Tests (`test-oauth-detailed.sh`)
- ✅ Callback with code but no cookies
- ✅ Callback with OAuth error parameter
- ✅ Callback without code parameter
- ✅ Callback route headers
- ✅ Clear cookies API response
- ✅ Cookie validation
- ✅ Route accessibility

## Manual Testing Steps

After all automated tests pass:

1. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application → Cookies → `http://localhost:3000`
   - Delete all cookies (especially `sb-*` cookies)

2. **Test Google OAuth:**
   - Visit `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect to `/home` or `/onboarding`

3. **Check terminal logs:**
   - Watch for cookie information
   - Look for any stale cookie warnings
   - Verify successful session creation

## Troubleshooting

If tests fail:
1. Make sure dev server is running: `npm run dev`
2. Check port 3000 is available
3. Verify environment variables are set
4. Check build: `npm run build`

If OAuth still fails:
1. Clear all browser cookies
2. Check Supabase redirect URLs configuration
3. Verify Google OAuth credentials in Supabase dashboard
4. Check terminal logs for detailed error messages


