CREATE OR REPLACE FUNCTION public.prevent_unverified_paid_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  IF NEW.status = 'PAID' AND OLD.status IS DISTINCT FROM 'PAID' THEN
    jwt_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      ''
    );
    -- Only the service role (used by verified Pi payment completion) may set PAID.
    -- Direct end-user updates arrive as 'authenticated' and are rejected.
    IF jwt_role <> 'service_role' AND jwt_role <> '' THEN
      RAISE EXCEPTION 'Orders can only be marked PAID by verified payment completion';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;