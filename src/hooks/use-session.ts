import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "farmer" | "buyer" | "admin";

export type SessionState = {
  loading: boolean;
  session: Session | null;
  userId: string | null;
  roles: UserRole[];
  piUsername: string | null;
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loading: true,
    session: null,
    userId: null,
    roles: [],
    piUsername: null,
  });

  useEffect(() => {
    let mounted = true;

    const load = async (session: Session | null) => {
      if (!session) {
        if (mounted)
          setState({
            loading: false,
            session: null,
            userId: null,
            roles: [],
            piUsername: null,
          });
        return;
      }
      const userId = session.user.id;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("pi_username").eq("id", userId).maybeSingle(),
      ]);
      if (!mounted) return;
      setState({
        loading: false,
        session,
        userId,
        roles: (roles ?? []).map((r) => r.role as UserRole),
        piUsername: profile?.pi_username ?? null,
      });
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      // Defer async work to avoid deadlock warning
      setTimeout(() => load(session), 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
