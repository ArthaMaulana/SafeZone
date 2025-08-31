-- Fix get_pending_reports function to show latest reports first
-- Run this in Supabase SQL Editor to fix the ordering issue

CREATE OR REPLACE FUNCTION get_pending_reports()
RETURNS TABLE (
    report_id BIGINT,
    user_id UUID,
    reporter_name TEXT,
    description TEXT,
    category public.report_category,
    status public.report_status,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    photo_url TEXT,
    created_at TIMESTAMPTZ,
    upvotes BIGINT,
    downvotes BIGINT,
    score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT
        r.id,
        r.user_id,
        p.display_name,
        r.description,
        r.category,
        r.status,
        r.lat,
        r.lng,
        r.end_lat,
        r.end_lng,
        r.photo_url,
        r.created_at,
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0)::BIGINT,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)::BIGINT,
        COALESCE(SUM(v.value), 0)::BIGINT
    FROM
        public.reports r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    LEFT JOIN public.votes v ON r.id = v.report_id
    WHERE r.status IN ('open', 'pending_review')
    GROUP BY
        r.id, r.user_id, p.display_name, r.description, r.category, r.status,
        r.lat, r.lng, r.end_lat, r.end_lng, r.photo_url, r.created_at
    ORDER BY
        r.created_at DESC;  -- FIXED: Changed from ASC to DESC to show latest first
END;
$$;
