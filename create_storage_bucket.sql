-- Create storage bucket for report photos
-- Run this in Supabase SQL Editor to enable file uploads

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Anyone can view report photos" ON storage.objects
FOR SELECT USING (bucket_id = 'report-photos');

CREATE POLICY "Authenticated users can upload report photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own report photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'report-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own report photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'report-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
