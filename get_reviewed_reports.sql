-- RPC function to get reviewed reports (approved/rejected) with admin details
CREATE OR REPLACE FUNCTION get_reviewed_reports()
RETURNS TABLE (
  report_id bigint,
  user_id uuid,
  reporter_name text,
  description text,
  category text,
  status text,
  lat double precision,
  lng double precision,
  end_lat double precision,
  end_lng double precision,
  photo_url text,
  created_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  admin_notes text,
  admin_email text,
  upvotes bigint,
  downvotes bigint,
  score bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    r.id as report_id,
    r.user_id,
    r.reporter_name,
    r.description,
    r.category,
    r.status,
    r.lat,
    r.lng,
    r.end_lat,
    r.end_lng,
    r.photo_url,
    r.created_at,
    r.reviewed_at,
    r.reviewed_by,
    r.admin_notes,
    p.email as admin_email,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score
  FROM reports r
  LEFT JOIN profiles p ON r.reviewed_by = p.id
  LEFT JOIN (
    SELECT 
      report_id,
      COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
      COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
    FROM votes 
    GROUP BY report_id
  ) v ON r.id = v.report_id
  WHERE r.status IN ('approved', 'rejected')
  ORDER BY r.reviewed_at DESC;
END;
$$;
