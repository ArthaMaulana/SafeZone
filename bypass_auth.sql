-- Alternative: Create auth bypass for development
-- Run this in Supabase SQL Editor

-- Create simple auth bypass function
CREATE OR REPLACE FUNCTION public.create_test_user(
  user_email text,
  user_password text DEFAULT 'password123'
)
RETURNS json AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Generate new UUID
  new_user_id := gen_random_uuid();
  
  -- Insert directly into profiles (bypass auth)
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (new_user_id, user_email, user_email)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'message', 'User created successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_user TO anon;
GRANT EXECUTE ON FUNCTION public.create_test_user TO authenticated;
