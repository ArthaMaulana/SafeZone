# SafeZone Setup Instructions

## 1. Supabase Configuration

### Step 1: Run SQL Schema
Copy and paste the contents of `fix_auth_schema.sql` into your Supabase SQL Editor and run it.

### Step 2: Disable Email Confirmation (for development)
1. Go to Authentication → Settings
2. Turn OFF "Enable email confirmations"
3. Save changes

### Step 3: Update RLS Policies
Run this SQL in Supabase SQL Editor:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
```

### Step 4: Test Authentication
1. Go to http://localhost:3001/test-auth
2. Test connection and auth
3. If successful, re-enable RLS with proper policies

## 2. Environment Variables

Update your `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=https://gcqleqrzncjqkelrndhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
```

## 3. Quick Test Commands

```bash
# Restart development server
npm run dev

# Test auth page
open http://localhost:3001/test-auth
```
