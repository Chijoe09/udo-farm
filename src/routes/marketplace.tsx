import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  q: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — UDO Farm" },
      {
        name: "description",
        content:
          "Browse bulk farm produce on UDO Farm. Filter by category, location and price. Pay with Pi.",
      },
    ],
  }),
  validateSearch: searchSchema,
  component: Marketplace,
});

const CATEGORIES = ["Grains", "Vegetables", "Fruits", "Tubers", "Legumes", "Other"];

function Marketplace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/marketplace" });
  const [q, setQ] = useState(search.q ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", search],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          "id,title,category,price_per_unit,unit,live_inventory,location,images,profiles:farmer_id(pi_username,verified)",
        )
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });

      if (search.category) query = query.eq("category", search.category);
      if (search.location) query = query.ilike("location", `%${search.location}%`);
      if (search.q) query = query.ilike("title", `%${search.q}%`);
      if (search.maxPrice) query = query.lte("price_per_unit", search.maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductCardData[];
    },
  });

  function updateSearch(patch: Partial<z.infer<typeof searchSchema>>) {
    navigate({ search: (old) => ({ ...old, ...patch }) });
  }

  return (
    <AppShell>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-4xl font-bold">Marketplace</h1>
          <p className="mt-2 text-muted-foreground">
            Bulk produce, direct from verified farmers. Prices in Pi.
          </p>

          <form
            className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              updateSearch({ q: q || undefined });
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search maize, tomatoes, yam..."
                className="h-12 rounded-xl pl-11"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl">
              Search
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select
              value={search.category ?? "all"}
              onValueChange={(v) => updateSearch({ category: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-9 w-[140px] rounded-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Location"
              value={search.location ?? ""}
              onChange={(e) => updateSearch({ location: e.target.value || undefined })}
              className="h-9 w-[160px] rounded-full"
            />

            <Input
              type="number"
              min={0}
              placeholder="Max π / unit"
              value={search.maxPrice ?? ""}
              onChange={(e) =>
                updateSearch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              className="h-9 w-[140px] rounded-full"
            />

            {(search.category || search.location || search.maxPrice || search.q) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQ("");
                  navigate({ search: {} });
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}
        {!isLoading && data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="font-display text-xl font-semibold">No produce matches your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing filters or checking back soon.
            </p>
          </div>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}
