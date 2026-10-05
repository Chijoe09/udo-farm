import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const validOtpTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
const searchSchema = z.object({ token_hash: z.string().optional(), type: z.string().optional() });

export const Route = createFileRoute("/signin/callback")({
  head: () => ({
    meta: [
      { title: "Pi sign-in callback — UDO Farm" },
      { name: "description", content: "Complete secure Pi Network sign-in to UDO Farm." },
      { property: "og:title", content: "Pi sign-in callback — UDO Farm" },
      { property: "og:description", content: "Complete secure Pi Network sign-in to UDO Farm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search) => {
    const parsed = searchSchema.parse(search);
    return {
      token_hash: parsed.token_hash,
      type: validOtpTypes.find((validType) => validType === parsed.type) ?? "magiclink",
    };
  },
  component: SignInCallback,
});

function SignInCallback() {
  const { token_hash, type } = Route.useSearch();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing Pi sign-in…");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!token_hash) {
      setMessage("Sign-in could not be completed. Return to UDO Farm and try again.");
      return;
    }

    // Send only the two OTP fields Supabase accepts; ignore state, error, and other Pi URL parameters.
    void supabase.auth.verifyOtp({ token_hash, type: type ?? "magiclink" }).then(({ error }) => {
      if (error) {
        setMessage("Sign-in could not be completed. Return to UDO Farm and try again.");
        toast.error(error.message);
        return;
      }
      toast.success("Welcome to UDO Farm");
      void navigate({ to: "/marketplace", replace: true });
    });
  }, [navigate, token_hash, type]);

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16 text-center" role="status" aria-live="polite">
        <h1 className="font-display text-2xl font-bold">Pi sign-in</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
      </div>
    </AppShell>
  );
}