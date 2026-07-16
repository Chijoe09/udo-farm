-- Restrict base profiles table SELECT to owner + admins, and expose a safe public view.
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;

CREATE POLICY "Users read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.profiles FROM anon;

-- Public view: only non-sensitive fields. security_invoker=off so it uses view owner's rights (safe: view has no PII columns).
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT id, pi_username, verified, location, avatar_url, rating, bio, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;