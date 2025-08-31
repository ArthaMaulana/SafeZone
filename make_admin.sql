-- Script to make a user admin
-- Replace 'your-email@example.com' with the actual admin email

-- First, find the user ID by email
-- UPDATE public.profiles 
-- SET is_admin = TRUE 
-- WHERE id = (
--     SELECT id FROM auth.users 
--     WHERE email = 'your-email@example.com'
-- );

-- Or if you know the user ID directly:
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = 'user-uuid-here';

-- To check current admin status:
-- SELECT p.id, u.email, p.is_admin 
-- FROM public.profiles p 
-- JOIN auth.users u ON p.id = u.id 
-- WHERE p.is_admin = TRUE;
