# TradeStack

AI-powered CRM and marketing platform for tradespeople.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Gemini API key (free tier available)
- Resend API key (for emails)

### Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - In the Supabase dashboard, go to SQL Editor
   - Run the SQL script from `supabase/schema.sql` to create all tables
   - Go to Settings > API to get your URL and keys

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Settings > API
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Settings > API
     - `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Settings > API (keep this secret!)
   - Add your Gemini API key:
     - `GEMINI_API_KEY` - From Google AI Studio (free)
   - Add your Resend API key (optional for now):
     - `RESEND_API_KEY` - From Resend.com
   - Set your app URL:
     - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

### First Steps

1. Sign up for a new account
2. Complete the onboarding form
3. Your public page will be at `/biz/{your-slug}`
4. Start adding services and collecting leads!

## Project Structure

- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and Supabase clients
- `supabase/` - Database schema
- `api/` - API routes for AI integrations

## Features

- ✅ User authentication
- ✅ Business onboarding
- ✅ Public landing pages
- ✅ Services management
- ✅ Leads tracking
- ✅ AI-powered CRM messaging
- ✅ Ad content generation
- ✅ Cold outreach automation
