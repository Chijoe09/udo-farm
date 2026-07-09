import { Link } from "@tanstack/react-router";
import { MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ProductCardData = {
  id: string;
  title: string;
  category: string;
  price_per_unit: number;
  unit: string;
  live_inventory: number;
  location: string | null;
  images: string[];
  profiles: { pi_username: string | null; verified: boolean } | null;
};

const FALLBACK_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23f3efe6'/><text x='50%' y='50%' text-anchor='middle' fill='%23a89f8b' font-family='sans-serif' font-size='22' dy='.3em'>No image</text></svg>";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.images[0] ?? FALLBACK_IMG}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-foreground">
          {product.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-display text-lg font-semibold">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-primary">
            @{product.profiles?.pi_username ?? "farmer"}
          </span>
          {product.profiles?.verified && (
            <Badge variant="outline" className="border-success/50 text-success">
              Verified
            </Badge>
          )}
        </div>
        {product.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {product.location}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="font-display text-2xl font-bold text-foreground">
              {product.price_per_unit} <span className="text-sm font-normal text-muted-foreground">π</span>
            </p>
            <p className="text-xs text-muted-foreground">per {product.unit}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <Package className="h-3 w-3" />
            {product.live_inventory} {product.unit}s
          </div>
        </div>
      </div>
    </Link>
  );
}
