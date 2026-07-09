import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { format } from "date-fns";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders — UDO Farm" }] }),
  component: OrdersPage,
});

const STEPS = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED"] as const;
type Step = (typeof STEPS)[number];

function OrdersPage() {
  const { userId } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["buyer", "orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*,products(id,title,unit,images)")
        .eq("buyer_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">My orders</h1>
        <p className="mt-1 text-muted-foreground">Track every purchase from payment to delivery.</p>

        {isLoading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        )}
        {!isLoading && data?.length === 0 && (
          <Card className="mt-6 p-10 text-center">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            <Link to="/marketplace" className="mt-2 inline-block text-primary underline">Browse marketplace →</Link>
          </Card>
        )}

        <div className="mt-6 space-y-4">
          {data?.map((o) => {
            const product = o.products as unknown as { id: string; title: string; unit: string; images: string[] };
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product?.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <Link to="/product/$id" params={{ id: product.id }} className="font-semibold hover:underline">
                        {product?.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {o.quantity} {product?.unit}s · {Number(o.total_price_pi).toFixed(2)} π · {o.delivery_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "PPP")}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{o.status.replace("_", " ")}</Badge>
                </div>

                <StatusTimeline status={o.status as Step} />
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function StatusTimeline({ status }: { status: Step }) {
  const idx = STEPS.indexOf(status);
  const labels: Record<Step, string> = {
    PENDING_PAYMENT: "Awaiting payment",
    PAID: "Paid",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
  };
  return (
    <div className="mt-5 flex items-center justify-between">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full ${
                  done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : current ? <CircleDot className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </span>
              <span className={`mt-1 text-[10px] font-medium sm:text-xs ${current ? "text-foreground" : "text-muted-foreground"}`}>
                {labels[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${done ? "bg-success" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
