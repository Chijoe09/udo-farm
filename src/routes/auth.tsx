import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sprout, ShoppingBasket, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isPiBrowserSync, piAuthenticate } from "@/lib/pi";
import { signInWithPi } from "@/lib/auth.functions";
import { z } from "zod";

const searchSchema = z.object({
  role: z.enum(["farmer", "buyer"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in with Pi — UDO Farm" },
      { name: "description", content: "Sign in to UDO Farm with your Pi Network identity to buy or sell bulk produce." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const signIn = useServerFn(signInWithPi);
  const [role, setRole] = useState<"buyer" | "farmer">(search.role ?? "buyer");
  const [mockUsername, setMockUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [inPi, setInPi] = useState(false);

  useEffect(() => {
    // Poll briefly for the async Pi SDK script to attach window.Pi.
    let cancelled = false;
    const start = Date.now();
    const tick = () => {
      if (cancelled) return;
      if (isPiBrowserSync()) {
        setInPi(true);
        return;
      }
      if (Date.now() - start < 4000) setTimeout(tick, 150);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  // Auto-trigger Pi authentication as soon as the SDK is available.
  const autoTriedRef = useRef(false);
  useEffect(() => {
    if (!inPi || autoTriedRef.current) return;
    autoTriedRef.current = true;
    void handlePiAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inPi]);

  async function handlePiAuth() {
    setLoading(true);
    try {
      let piAccessToken: string | undefined;
      if (inPi) {
        const res = await piAuthenticate();
        piAccessToken = res.accessToken;
      }
      const result = await signIn({
        data: {
          role,
          piAccessToken,
          mockUsername: !inPi ? mockUsername.trim() : undefined,
        },
      });
      // Supabase verifyOtp with token_hash must ONLY receive token_hash + type.
      // Passing extra fields (email, state, etc.) triggers:
      // "Only the token_hash and type should be provided"
      toast.success(`Welcome, @${result.piUsername}`);
      navigate({
        to: "/signin/callback",
        search: { token_hash: result.hashed_token, type: "magiclink" },
        replace: true,
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:py-20">
        <span className="grid h-16 w-16 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
          <Sprout className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-center font-display text-3xl font-bold">
          Welcome to UDO Farm
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Sign in with your Pi Network identity.
        </p>

        <Card className="mt-6 w-full p-6">
          <Label className="mb-3 block text-sm font-medium">I want to</Label>
          <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)} className="grid grid-cols-2 gap-3">
            <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${role === "buyer" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="buyer" className="sr-only" />
              <ShoppingBasket className="h-5 w-5" />
              Buy produce
            </label>
            <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${role === "farmer" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="farmer" className="sr-only" />
              <Sprout className="h-5 w-5" />
              Sell as a farmer
            </label>
          </RadioGroup>

          {!inPi && (
            <div className="mt-5 space-y-2">
              <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-warning-foreground/90">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p>
                  Pi Browser not detected. You're in <strong>dev mode</strong> — enter a username to explore. In production, open UDO Farm in the Pi Browser to sign in with your real Pi identity.
                </p>
              </div>
              <Label htmlFor="mock" className="text-sm">Pi username (dev mode)</Label>
              <Input
                id="mock"
                value={mockUsername}
                onChange={(e) => setMockUsername(e.target.value)}
                placeholder="pioneer_jane"
                autoComplete="off"
              />
            </div>
          )}

          <Button
            onClick={handlePiAuth}
            disabled={loading || (!inPi && mockUsername.trim().length < 2)}
            size="lg"
            className="mt-5 h-12 w-full gradient-brand text-primary-foreground"
          >
            {loading ? "Signing in..." : inPi ? "Continue with Pi" : "Continue (dev mode)"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
