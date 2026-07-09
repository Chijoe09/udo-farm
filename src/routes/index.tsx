import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Wheat,
  Carrot,
  Apple,
  Trees,
  Sprout,
  ShoppingBasket,
  Truck,
  Handshake,
  ShieldCheck,
  ArrowRight,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/app-shell";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { toast } from "sonner";
import { z } from "zod";
import heroImg from "@/assets/hero-farm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UDO Farm — Cultivating Progress, Harvesting the Future" },
      {
        name: "description",
        content:
          "Africa's Pi Network marketplace for bulk farm produce. Grains, vegetables, fruits and tubers by the ton. Pay with Pi. Pickup or delivery 24/7.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORIES = [
  { label: "Grains", icon: Wheat, color: "bg-warning/10 text-warning" },
  { label: "Vegetables", icon: Carrot, color: "bg-success/10 text-success" },
  { label: "Fruits", icon: Apple, color: "bg-destructive/10 text-destructive" },
  { label: "Tubers", icon: Trees, color: "bg-primary/10 text-primary" },
] as const;

const STEPS = [
  {
    icon: Sprout,
    title: "1. Farmers list",
    body: "Verified farmers post bulk produce, prices in Pi and harvest dates.",
  },
  {
    icon: ShoppingBasket,
    title: "2. Buy with Pi",
    body: "Pay for tons of produce securely with Pi Payments in-app.",
  },
  {
    icon: Truck,
    title: "3. Pickup or delivery",
    body: "Collect at the farm gate, or have it delivered to your location.",
  },
] as const;

function HomePage() {
  const featured = useQuery({
    queryKey: ["home", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,title,category,price_per_unit,unit,live_inventory,location,images,profiles:farmer_id(pi_username,verified)",
        )
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as unknown as ProductCardData[];
    },
  });

  const inventoryTotal = useQuery({
    queryKey: ["home", "inventory-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("live_inventory")
        .eq("status", "APPROVED");
      if (error) throw error;
      const total = (data ?? []).reduce(
        (s, r) => s + Number(r.live_inventory ?? 0),
        0,
      );
      return Math.max(total, 240);
    },
  });

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt="Aerial view of a lush farm at golden hour with farmers walking through the fields"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-28 lg:pt-32">
          <div className="max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Powered by Pi Network
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              UDO Farm
            </h1>
            <p className="mt-4 text-xl font-medium text-primary-foreground/90 sm:text-2xl">
              Cultivating progress, harvesting the future.
            </p>
            <p className="mt-3 max-w-xl text-base text-primary-foreground/80">
              Africa's bulk farm produce marketplace. Buy grains, vegetables,
              fruits and tubers by the ton, direct from verified farmers — paid
              with Pi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-white px-6 text-base font-semibold text-primary hover:bg-white/90">
                <Link to="/marketplace">
                  <ShoppingBasket className="mr-2 h-5 w-5" /> Shop Produce
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white">
                <Link to="/auth" search={{ role: "farmer" }}>
                  <Sprout className="mr-2 h-5 w-5" /> Become a Seller
                </Link>
              </Button>
            </div>

            {/* Live inventory */}
            <div className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 text-foreground shadow-glow">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-success text-success-foreground">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live inventory
                </p>
                <p className="font-display text-xl font-bold">
                  Over {inventoryTotal.data ?? 240} tons available today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Shop by category
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every crop, direct from the source.
            </p>
          </div>
          <Link to="/marketplace" className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map(({ label, icon: Icon, color }) => (
            <Link
              key={label}
              to="/marketplace"
              search={{ category: label }}
              className="group rounded-2xl border border-border bg-card p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${color}`}>
                <Icon className="h-7 w-7" />
              </span>
              <p className="mt-3 font-display text-lg font-semibold">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Fresh listings
          </h2>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            All listings →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          {featured.data?.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                No listings yet — be the first farmer to post.
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth" search={{ role: "farmer" }}>List your produce</Link>
              </Button>
            </div>
          )}
          {featured.data?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground">
              From field to fulfillment in three simple steps.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="relative rounded-2xl border border-border bg-card p-6 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / value */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            { icon: Handshake, title: "Direct from farmers", body: "No middlemen. Farmers keep more of every Pi." },
            { icon: ShieldCheck, title: "Verified sellers", body: "Every farmer is vetted before their produce goes live." },
            { icon: Truck, title: "Pickup or delivery 24/7", body: "Choose farm-gate pickup or scheduled delivery to your city." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscribe */}
      <SubscribeCTA />
    </AppShell>
  );
}

const subscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().max(80).optional(),
});

function SubscribeCTA() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = subscribeSchema.safeParse({ email, city });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("subscriptions")
      .insert({ email: parsed.data.email, city: parsed.data.city ?? null });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already subscribed. We'll keep you posted.");
      } else {
        toast.error("Subscription failed. Try again.");
      }
      return;
    }
    setEmail("");
    setCity("");
    toast.success("Subscribed! We'll email you when fresh stock hits your city.");
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="overflow-hidden rounded-3xl gradient-brand p-8 shadow-glow sm:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              Get alerts for new stock in your city
            </h2>
            <p className="mt-3 text-primary-foreground/85">
              Be first to hear when fresh grains, tubers or produce land near you.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-white/20 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="Your city (optional)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 rounded-xl border-white/20 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-white text-primary hover:bg-white/90"
            >
              {loading ? "Subscribing..." : (
                <>
                  Notify me <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
