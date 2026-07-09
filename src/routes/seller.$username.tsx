import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/seller/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — UDO Farm seller` },
      { name: "description", content: `Bulk farm produce listings from @${params.username} on UDO Farm.` },
    ],
  }),
  component: SellerProfile,
});

function SellerProfile() {
  const { username } = Route.useParams();

  const q = useQuery({
    queryKey: ["seller-profile", username],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("pi_username", username)
        .maybeSingle();
      if (!profile) throw notFound();
      const { data: products } = await supabase
        .from("products")
        .select("id,title,category,price_per_unit,unit,live_inventory,location,images,profiles:farmer_id(pi_username,verified)")
        .eq("farmer_id", profile.id)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });
      return { profile, products: (products ?? []) as unknown as ProductCardData[] };
    },
  });

  if (q.isLoading) {
    return <AppShell><div className="mx-auto max-w-6xl p-8"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></div></AppShell>;
  }
  if (!q.data) return null;
  const { profile, products } = q.data;

  return (
    <AppShell>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-10 sm:px-6">
          <span className="grid h-20 w-20 place-items-center rounded-full gradient-brand text-2xl font-bold text-primary-foreground">
            {username.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
              @{profile.pi_username}
              {profile.verified && (
                <Badge variant="outline" className="border-success/50 text-success">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                </Badge>
              )}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>}
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {Number(profile.rating).toFixed(1)}</span>
            </div>
            {profile.bio && <p className="mt-2 max-w-xl text-sm">{profile.bio}</p>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-xl font-bold">Listings ({products.length})</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No active listings yet.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
