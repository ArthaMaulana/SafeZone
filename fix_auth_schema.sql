-- Fix authentication schema for SafeZone
-- Run this in Supabase SQL Editor to fix RLS policies

-- First, ensure we have the correct policies for profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow anyone to view profiles (needed for display names)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles 
FOR SELECT USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Fix reports policies - allow authenticated users to create reports
DROP POLICY IF EXISTS "Authenticated users can create reports." ON public.reports;
CREATE POLICY "Authenticated users can create reports." ON public.reports 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow anyone to view reports
DROP POLICY IF EXISTS "Anyone can view reports." ON public.reports;
CREATE POLICY "Anyone can view reports." ON public.reports 
FOR SELECT USING (true);

-- Users can update/delete their own reports
DROP POLICY IF EXISTS "Users can update their own reports." ON public.reports;
CREATE POLICY "Users can update their own reports." ON public.reports 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reports." ON public.reports;
CREATE POLICY "Users can delete their own reports." ON public.reports 
FOR DELETE USING (auth.uid() = user_id);

-- Fix votes policies - require authentication but allow flexible user_id
DROP POLICY IF EXISTS "Authenticated users can create votes." ON public.votes;
CREATE POLICY "Authenticated users can create votes." ON public.votes 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow anyone to view votes
DROP POLICY IF EXISTS "Anyone can view votes." ON public.votes;
CREATE POLICY "Anyone can view votes." ON public.votes 
FOR SELECT USING (true);

-- Users can update/delete votes where user_id matches their auth.uid() as text
DROP POLICY IF EXISTS "Users can update their own votes." ON public.votes;
CREATE POLICY "Users can update their own votes." ON public.votes 
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes." ON public.votes;
CREATE POLICY "Users can delete their own votes." ON public.votes 
FOR DELETE USING (auth.uid()::text = user_id);

-- Ensure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.email, 'User'));
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- If profile already exists, just return
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
