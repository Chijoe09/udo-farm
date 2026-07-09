import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — UDO Farm" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { userId } = useSession();
  const qc = useQueryClient();

  const pendingQ = useQuery({
    queryKey: ["admin", "pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*,profiles:farmer_id(pi_username)")
        .eq("status", "PENDING")
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Product ${status.toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["admin", "pending"] });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin</h1>
            <p className="text-muted-foreground text-sm">Review pending listings.</p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Pending approval ({pendingQ.data?.length ?? 0})</h2>
          <div className="mt-4 space-y-3">
            {pendingQ.data?.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">Nothing to review. 🌾</Card>
            )}
            {pendingQ.data?.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by @{(p.profiles as unknown as { pi_username: string } | null)?.pi_username} ·
                      {" "}{p.category} · {p.price_per_unit} π/{p.unit} · {p.live_inventory} {p.unit}s
                    </p>
                    {p.location && <p className="text-xs text-muted-foreground">📍 {p.location}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{format(new Date(p.created_at), "PPP")}</p>
                    {p.description && <p className="mt-2 line-clamp-2 text-sm">{p.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(p.id, "APPROVED")} className="bg-success text-success-foreground hover:bg-success/90">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(p.id, "REJECTED")}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">Signed in as admin · {userId}</p>
      </div>
    </AppShell>
  );
}
