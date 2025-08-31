-- Fix RLS policies for reports table
-- Run this in Supabase SQL Editor

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- 2. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reports';

-- 3. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own reports." ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports." ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports." ON public.reports;

-- 4. Create permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to insert reports" 
ON public.reports FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Allow everyone to view approved reports" 
ON public.reports FOR SELECT 
TO public 
USING (status IN ('approved', 'verified', 'resolved', 'pending_review'));

CREATE POLICY "Allow users to view their own reports" 
ON public.reports FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own reports" 
ON public.reports FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 6. Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reports';
