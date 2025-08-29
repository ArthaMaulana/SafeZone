-- Fix votes table RLS policies untuk allow anonymous voting
-- Run this in Supabase SQL Editor

-- 1. FIRST: Drop ALL existing policies on votes table
DROP POLICY IF EXISTS "Anyone can view votes." ON public.votes;
DROP POLICY IF EXISTS "Users can create their own votes." ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes." ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes." ON public.votes;
DROP POLICY IF EXISTS "Users can update or delete their own votes." ON public.votes;
DROP POLICY IF EXISTS "Anyone can create votes." ON public.votes;
DROP POLICY IF EXISTS "Anyone can update votes." ON public.votes;
DROP POLICY IF EXISTS "Anyone can delete votes." ON public.votes;

-- 2. Remove foreign key constraint to profiles
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;

-- 3. NOW we can alter the column type
ALTER TABLE public.votes ALTER COLUMN user_id TYPE TEXT;

-- 4. Create new simple policy for all operations
CREATE POLICY "Allow all votes operations" ON public.votes FOR ALL USING (true) WITH CHECK (true);

-- 5. Alternative: Disable RLS completely (uncomment if needed)
-- ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;

-- 6. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'votes';
