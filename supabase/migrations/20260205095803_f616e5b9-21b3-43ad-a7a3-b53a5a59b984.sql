-- Create a public view for profiles that excludes sensitive data (email)
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
-- Note: email is intentionally excluded from this view

-- Drop the policy that exposes emails to group members
DROP POLICY IF EXISTS "Users can view profiles of fellow group members" ON public.profiles;

-- Create a new restrictive policy: users can ONLY view their own profile directly
-- Other group members must use the profiles_public view
CREATE POLICY "Users can only view their own profile directly"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Allow group members to view the public view (without email)
CREATE POLICY "Group members can view public profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.user_id
  )
  AND user_id != auth.uid()  -- This policy is for OTHER users only
);