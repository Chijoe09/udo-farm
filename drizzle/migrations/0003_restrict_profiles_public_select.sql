DROP POLICY IF EXISTS "Profiles readable rows" ON public.profiles;

CREATE POLICY "Public seller profiles readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.farmer_id = profiles.id
      AND p.status = 'APPROVED'::product_status
  )
);