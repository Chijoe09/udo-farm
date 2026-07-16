-- Remove the security-definer view flagged by the linter.
DROP VIEW IF EXISTS public.profiles_public;

-- Reset base-table policies to a single permissive SELECT; column privileges do the gating.
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

CREATE POLICY "Profiles readable rows"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke blanket SELECT, then grant only non-sensitive columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT
  (id, pi_username, verified, location, avatar_url, rating, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- Owner-only reader for full profile (email, phone, pi_user_id).
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;