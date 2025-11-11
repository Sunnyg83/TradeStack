# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for TradeStack.

## Prerequisites

- A Supabase account and project
- A Google Cloud Console account
- Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: TradeStack
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. For **Application type**, select **Web application**
7. Add **Authorized redirect URIs**:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
   - Also add: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to enable it
5. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URLs to **Redirect URLs**:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
   - Make sure `https://your-domain.com/**` is in the **Site URL** field
3. Click **Save**

## Step 4: Update Environment Variables (Optional)

If you're running locally, you don't need any additional environment variables. Supabase handles the OAuth configuration.

However, make sure you have:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These should already be set in your `.env.local` file.

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Click **Sign in with Google** or **Sign up with Google**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app
6. If it's a new user, they'll be redirected to `/onboarding`
7. If it's an existing user, they'll be redirected to `/dashboard`

## Troubleshooting

### "Redirect URI mismatch" error

- Make sure you've added the correct redirect URIs in both Google Cloud Console and Supabase
- The redirect URI must match exactly (including `http` vs `https`)

### "OAuth client not found" error

- Verify your Client ID and Client Secret are correct in Supabase
- Make sure Google OAuth is enabled in Supabase

### User not redirected after sign-in

- Check that the callback route (`/auth/callback`) is accessible
- Verify the redirect URL in Supabase matches your app's URL
- Check the browser console for errors

### User not created in database

- Make sure your Supabase project has the `profiles` table set up
- Check that Row Level Security (RLS) policies allow user creation
- Verify the database triggers are set up correctly

## Production Deployment

When deploying to production (e.g., Vercel):

1. Update Google Cloud Console with your production domain:
   - Add `https://your-production-domain.com/auth/callback` to Authorized redirect URIs
2. Update Supabase with your production domain:
   - Add `https://your-production-domain.com/auth/callback` to Redirect URLs
   - Update Site URL to `https://your-production-domain.com`
3. Redeploy your application

## Security Notes

- Never commit your Google Client Secret to version control
- Keep your OAuth credentials secure
- Use environment variables for sensitive data
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)


