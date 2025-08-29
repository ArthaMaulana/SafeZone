-- Add route columns to reports table if they don't exist
DO $$
BEGIN
    -- Add end_lat column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name = 'end_lat'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reports ADD COLUMN end_lat DOUBLE PRECISION;
    END IF;
    
    -- Add end_lng column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name = 'end_lng'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reports ADD COLUMN end_lng DOUBLE PRECISION;
    END IF;
END$$;

-- Create index for end coordinates if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_reports_end_geo ON public.reports USING gist (end_lat, end_lng);

-- Update the RPC function to ensure it returns the correct columns
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
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(SUM(v.value), 0) AS score
    FROM
        public.reports r
    LEFT JOIN
        public.votes v ON r.id = v.report_id
    GROUP BY
        r.id, r.description, r.category, r.status, r.created_at, r.lat, r.lng, r.end_lat, r.end_lng
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
