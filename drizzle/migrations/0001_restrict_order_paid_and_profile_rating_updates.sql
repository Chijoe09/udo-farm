-- 1) Profiles: users may only edit contact/bio columns, never rating/verified/pi identity
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (phone, email, location, bio, avatar_url) ON public.profiles TO authenticated;

-- 2) Orders: block anyone acting as an end user from setting status to PAID.
--    Payment completion runs through the SECURITY DEFINER complete_pi_order()
--    (executes as the function owner), so it is unaffected.
CREATE OR REPLACE FUNCTION public.prevent_unverified_paid_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'PAID' AND OLD.status IS DISTINCT FROM 'PAID'
     AND current_setting('request.jwt.claims', true) IS NOT NULL THEN
    RAISE EXCEPTION 'Orders can only be marked PAID by verified payment completion';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unverified_paid ON public.orders;
CREATE TRIGGER trg_prevent_unverified_paid
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_unverified_paid_status();