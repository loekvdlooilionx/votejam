-- Drop the policy that exposes email addresses to group members
DROP POLICY IF EXISTS "Group members can view public profiles" ON public.profiles;

-- The profiles_public view (which excludes email) should be used instead
-- Ensure the view has security_invoker enabled for proper RLS
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;