# SafeZone Admin System Setup

## 1. Apply Database Schema Changes

Copy and run the following SQL in your Supabase SQL Editor:

```sql
-- Admin System Schema Updates for SafeZone
-- Add admin role management and enhanced report status system

-- 1. Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Update report_status enum to include more granular statuses
-- First, add new status values to existing enum
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'rejected';

-- 3. Add admin-related columns to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 4. Create admin policies for reports management
DROP POLICY IF EXISTS "Admins can manage all reports." ON public.reports;
CREATE POLICY "Admins can manage all reports." ON public.reports 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- 5. Create admin-only view for report management
CREATE OR REPLACE VIEW public.admin_report_summary AS
SELECT
    r.id AS report_id,
    r.user_id,
    p.display_name AS reporter_name,
    r.description,
    r.category,
    r.status,
    r.lat,
    r.lng,
    r.end_lat,
    r.end_lng,
    r.photo_url,
    r.created_at,
    r.reviewed_by,
    r.reviewed_at,
    r.admin_notes,
    admin_p.display_name AS reviewed_by_name,
    COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
    COALESCE(SUM(v.value), 0) AS score
FROM
    public.reports r
LEFT JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN public.profiles admin_p ON r.reviewed_by = admin_p.id
LEFT JOIN public.votes v ON r.id = v.report_id
GROUP BY
    r.id, r.user_id, p.display_name, r.description, r.category, r.status,
    r.lat, r.lng, r.end_lat, r.end_lng, r.photo_url, r.created_at,
    r.reviewed_by, r.reviewed_at, r.admin_notes, admin_p.display_name
ORDER BY
    r.created_at DESC;

-- 6. RPC function for admin to update report status
CREATE OR REPLACE FUNCTION admin_update_report_status(
    report_id_param BIGINT,
    new_status public.report_status,
    admin_notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if current user is admin
    SELECT id INTO admin_user_id
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Update the report
    UPDATE public.reports
    SET 
        status = new_status,
        reviewed_by = admin_user_id,
        reviewed_at = now(),
        admin_notes = admin_notes_param
    WHERE id = report_id_param;
    
    RETURN TRUE;
END;
$$;

-- 7. RPC function to get pending reports for admin review
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
        r.created_at ASC;
END;
$$;

-- 8. Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    );
END;
$$;

-- 9. Update the main get_all_reports_with_scores function to only show approved reports for public
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
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0)::BIGINT,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)::BIGINT,
        COALESCE(SUM(v.value), 0)::BIGINT
    FROM
        public.reports r
    LEFT JOIN public.votes v ON r.id = v.report_id
    WHERE r.status IN ('approved', 'verified', 'resolved') -- Only show approved reports to public
    GROUP BY
        r.id, r.description, r.category, r.status, r.created_at,
        r.lat, r.lng, r.end_lat, r.end_lng
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## 2. Make Yourself Admin

After applying the schema, run this SQL to make your account an admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'your-email@example.com'
);
```

## 3. Access Admin Dashboard

1. Login to your SafeZone account
2. Click on your profile in the navbar
3. You should see "Administrator" status and "Admin Dashboard" link
4. Click "Admin Dashboard" to access the admin panel

## Features

### Admin Dashboard Features:
- **Pending Reports View**: See all reports waiting for approval
- **Report Details**: Full report information including photos, location, community votes
- **Approval/Rejection**: Approve or reject reports with optional admin notes
- **Status Tracking**: Track which admin reviewed each report and when

### Report Flow:
1. **User submits report** → Status: `pending_review`
2. **Admin reviews** → Status: `approved` or `rejected`
3. **Public map** → Only shows `approved`, `verified`, or `resolved` reports

### Admin Actions:
- **Approve**: Report becomes visible on public map
- **Reject**: Report is hidden from public map
- **Add Notes**: Optional admin comments for internal tracking

## Security Features:
- Admin-only access to dashboard and functions
- Proper RLS policies for admin operations
- Secure admin status checking
- Protected admin functions with authentication

## Next Steps:
1. Apply the database schema changes
2. Make yourself admin using the SQL command
3. Test the admin dashboard functionality
4. Create additional admin accounts as needed
