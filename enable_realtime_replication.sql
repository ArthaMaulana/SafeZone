-- Enable realtime replication for reports table
-- This is required for Supabase realtime subscriptions to work properly
-- Run this in Supabase SQL Editor

-- Enable replica identity for reports table (required for realtime)
ALTER TABLE public.reports REPLICA IDENTITY FULL;

-- Enable realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

-- Enable replica identity for votes table (required for realtime)
ALTER TABLE public.votes REPLICA IDENTITY FULL;

-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Verify the setup
SELECT schemaname, tablename, hasindexes, hasrules, hastriggers 
FROM pg_tables 
WHERE tablename IN ('reports', 'votes');

-- Check if tables are in realtime publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
