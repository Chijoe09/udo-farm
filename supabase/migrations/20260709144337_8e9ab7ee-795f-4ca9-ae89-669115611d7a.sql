
-- Lock down definer functions
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Tighten permissive insert policies with basic validation
DROP POLICY "Anyone subscribes" ON public.subscriptions;
CREATE POLICY "Anyone subscribes" ON public.subscriptions FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%.__%');

DROP POLICY "Anyone submits contact" ON public.contact_messages;
CREATE POLICY "Anyone submits contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 320
    AND email LIKE '%_@_%.__%'
    AND char_length(message) BETWEEN 1 AND 4000
  );
