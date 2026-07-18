
-- Owner can read own full profile row
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Remove the SECURITY DEFINER helper (owner policy above supersedes it)
DROP FUNCTION IF EXISTS public.get_my_profile();
