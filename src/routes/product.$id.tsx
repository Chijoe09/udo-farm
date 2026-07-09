import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package, ShieldCheck, ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

const FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23f3efe6'/></svg>";

function ProductDetail() {
  const { id } = Route.useParams();
  const { userId } = useSession();

  const productQ = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "*,profiles:farmer_id(id,pi_username,verified,location,avatar_url,rating,bio)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const ordersQ = useQuery({
    queryKey: ["product-orders", id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,quantity,total_price_pi,status,created_at")
        .eq("product_id", id)
        .eq("buyer_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (productQ.isLoading)
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl p-8">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      </AppShell>
    );

  const p = productQ.data;
  if (!p) return null;
  const images = p.images?.length ? p.images : [FALLBACK];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/marketplace" className="hover:text-foreground">Marketplace</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{p.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted shadow-soft">
              <img
                src={images[0]}
                alt={p.title}
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((src: string, i: number) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{p.category}</Badge>
                {p.status === "APPROVED" && (
                  <Badge className="bg-success text-success-foreground">In stock</Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{p.title}</h1>
              {p.location && (
                <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {p.location}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p>
                  <p className="font-display text-4xl font-bold">
                    {p.price_per_unit} <span className="text-lg font-normal text-muted-foreground">π / {p.unit}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-warning/10 px-3 py-2 text-right">
                  <p className="text-xs font-medium text-warning-foreground/70">Live inventory</p>
                  <p className="font-display text-lg font-bold text-warning-foreground">
                    Only {p.live_inventory} {p.unit}s left
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="h-12 flex-1 gradient-brand text-primary-foreground">
                  <Link to="/checkout/$productId" params={{ productId: p.id }}>
                    Buy Now with Pi <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 flex-1">
                  <Link to="/checkout/$productId" params={{ productId: p.id }} search={{ apply: true }}>
                    Apply for stock
                  </Link>
                </Button>
              </div>

              {p.harvest_date && (
                <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Harvested {format(new Date(p.harvest_date), "PPP")}
                </p>
              )}
            </div>

            {/* Seller */}
            {p.profiles && (
              <Link
                to="/seller/$username"
                params={{ username: p.profiles.pi_username ?? "" }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-muted/40"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full gradient-brand text-lg font-bold text-primary-foreground">
                  {(p.profiles.pi_username ?? "F").slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    @{p.profiles.pi_username}
                    {p.profiles.verified && (
                      <Badge variant="outline" className="border-success/50 text-success">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Verified farmer
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.profiles.location ?? "Location on request"} · ★ {Number(p.profiles.rating).toFixed(1)}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}

            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="orders">Your orders</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="pt-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {p.description ?? "No description provided."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total quantity</p>
                    <p className="font-semibold">{p.quantity} {p.unit}s</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Available now</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" /> {p.live_inventory} {p.unit}s
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="orders" className="pt-4">
                {!userId && (
                  <p className="text-sm text-muted-foreground">
                    <Link to="/auth" className="text-primary underline">Sign in</Link> to see your order history for this product.
                  </p>
                )}
                {userId && ordersQ.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">You haven't ordered this product yet.</p>
                )}
                {ordersQ.data?.map((o) => (
                  <div key={o.id} className="mt-2 flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{o.quantity} {p.unit}s · {o.total_price_pi} π</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "PPP")}</p>
                    </div>
                    <Badge variant="outline">{o.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
