import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Package, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller dashboard — UDO Farm" }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const { userId, piUsername } = useSession();

  const productsQ = useQuery({
    queryKey: ["seller", "products", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("farmer_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["seller", "orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*,products!inner(farmer_id,title,unit)")
        .eq("products.farmer_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const earnings = (ordersQ.data ?? [])
    .filter((o) => o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED")
    .reduce((s, o) => s + Number(o.total_price_pi), 0);

  const monthEarnings = (ordersQ.data ?? [])
    .filter((o) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        (o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED")
      );
    })
    .reduce((s, o) => s + Number(o.total_price_pi), 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome back, @{piUsername}
            </h1>
            <p className="mt-1 text-muted-foreground">Manage your listings and orders.</p>
          </div>
          <Button asChild size="lg" className="gradient-brand text-primary-foreground">
            <Link to="/seller/new">
              <Plus className="mr-2 h-4 w-4" /> List new product
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Pi Earned" value={`${earnings.toFixed(2)} π`} icon={TrendingUp} tone="success" />
          <StatCard label="This month" value={`${monthEarnings.toFixed(2)} π`} icon={TrendingUp} tone="primary" />
          <StatCard label="Active listings" value={String(productsQ.data?.filter((p) => p.status === "APPROVED").length ?? 0)} icon={Package} tone="warning" />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">My products</h2>
          <div className="mt-4 space-y-3">
            {productsQ.data?.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                No products yet — <Link to="/seller/new" className="text-primary underline">list your first bulk produce</Link>.
              </Card>
            )}
            {productsQ.data?.map((p) => (
              <Card key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.price_per_unit} π / {p.unit} · {p.live_inventory} {p.unit}s available
                  </p>
                </div>
                <StatusPill status={p.status} />
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Incoming orders</h2>
          <div className="mt-4 space-y-3">
            {ordersQ.data?.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">No orders yet.</Card>
            )}
            {ordersQ.data?.map((o) => (
              <Card key={o.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {o.quantity} {(o.products as unknown as { unit: string }).unit}s of {(o.products as unknown as { title: string }).title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(o.created_at), "PPP")} · {o.delivery_type} · {Number(o.total_price_pi).toFixed(2)} π
                    </p>
                  </div>
                  <OrderStatusActions orderId={o.id} status={o.status} onDone={() => ordersQ.refetch()} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: "primary" | "success" | "warning";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: typeof Clock }> = {
    PENDING: { cls: "bg-warning/10 text-warning", label: "Pending review", icon: Clock },
    APPROVED: { cls: "bg-success/10 text-success", label: "Live", icon: CheckCircle2 },
    REJECTED: { cls: "bg-destructive/10 text-destructive", label: "Rejected", icon: XCircle },
    SOLD: { cls: "bg-muted text-muted-foreground", label: "Sold out", icon: Package },
  };
  const s = map[status] ?? map.PENDING;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function OrderStatusActions({
  orderId,
  status,
  onDone,
}: {
  orderId: string;
  status: string;
  onDone: () => void;
}) {
  async function update(next: "SHIPPED" | "DELIVERED") {
    await supabase.from("orders").update({ status: next }).eq("id", orderId);
    onDone();
  }
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">{status.replace("_", " ")}</Badge>
      {status === "PAID" && (
        <Button size="sm" onClick={() => update("SHIPPED")}>Mark shipped</Button>
      )}
      {status === "SHIPPED" && (
        <Button size="sm" onClick={() => update("DELIVERED")}>Mark delivered</Button>
      )}
    </div>
  );
}
