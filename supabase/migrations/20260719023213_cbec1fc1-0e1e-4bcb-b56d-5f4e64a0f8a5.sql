
-- Restrict column access on profiles so email/phone aren't exposed publicly
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, pi_user_id, pi_username, avatar_url, bio, location, rating, verified, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- Owners still need to update their own row (including email/phone)
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Secure accessor for the caller's own sensitive fields
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id uuid,
  email text,
  phone text,
  location text,
  bio text,
  avatar_url text,
  pi_username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, phone, location, bio, avatar_url, pi_username
  FROM public.profiles
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
