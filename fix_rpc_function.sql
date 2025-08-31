-- Fix RPC function to show all reports including pending_review
-- Run this in Supabase SQL Editor

-- Drop and recreate the RPC function with proper filtering
DROP FUNCTION IF EXISTS get_all_reports_with_scores();

CREATE OR REPLACE FUNCTION get_all_reports_with_scores()
RETURNS TABLE (
    report_id BIGINT,
    description TEXT,
    category public.report_category,
    status public.report_status,
    created_at TIMESTAMPTZ,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    photo_url TEXT,
    upvotes BIGINT,
    downvotes BIGINT,
    score BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.description,
        r.category,
        r.status,
        r.created_at,
        r.lat,
        r.lng,
        r.end_lat,
        r.end_lng,
        r.photo_url,
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) as downvotes,
        COALESCE(SUM(v.value), 0) as score
    FROM
        public.reports r
    LEFT JOIN
        public.votes v ON r.id = v.report_id
    GROUP BY
        r.id, r.description, r.category, r.status, r.created_at, 
        r.lat, r.lng, r.end_lat, r.end_lng, r.photo_url
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_all_reports_with_scores() LIMIT 5;
