-- Fix RLS policies untuk allow anonymous reports
-- Run this in Supabase SQL Editor

-- 1. Disable RLS completely untuk table reports
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- 2. Atau jika ingin tetap pakai RLS, update policy
-- DROP POLICY IF EXISTS "Users can create their own reports." ON public.reports;
-- DROP POLICY IF EXISTS "Anyone can create reports." ON public.reports;
-- CREATE POLICY "Allow all inserts" ON public.reports FOR INSERT WITH CHECK (true);

-- 3. Make sure user_id can be null
ALTER TABLE public.reports ALTER COLUMN user_id DROP NOT NULL;

-- 4. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reports';

-- 5. Check RLS status
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';
