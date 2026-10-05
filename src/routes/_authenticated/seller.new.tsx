import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/seller/new")({
  head: () => ({ meta: [{ title: "New listing — UDO Farm" }] }),
  component: NewListing,
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.coerce.number().min(0.001, "Price must be 0.001 to 0.1 Pi per Pi policy").max(0.1, "Price must be 0.001 to 0.1 Pi per Pi policy"),
  location: z.string().trim().max(120).optional(),
  harvestDate: z.string().optional(),
});

const CATEGORIES = ["Grains", "Vegetables", "Fruits", "Tubers", "Legumes", "Other"];

function NewListing() {
  const { userId } = useSession();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !userId) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 5)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("products").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("products").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the listing details");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("products").insert({
      farmer_id: userId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      price_per_unit: parsed.data.pricePerUnit,
      images,
      location: parsed.data.location ?? null,
      harvest_date: parsed.data.harvestDate || null,
      live_inventory: parsed.data.quantity,
      status: "PENDING",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing submitted for review!");
    navigate({ to: "/seller" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">List new produce</h1>
        <p className="mt-1 text-muted-foreground">
          Submissions go live after admin approval.
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label>Product images (up to 5)</Label>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground hover:bg-muted">
                    <Upload className="h-5 w-5" />
                    {uploading ? "Uploading..." : "Upload"}
                    <input type="file" accept="image/*" multiple hidden onChange={onUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="Premium yellow maize" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue="Grains">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Ibadan, Nigeria" />
              </div>
              <div>
                <Label htmlFor="quantity">Total quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min={0.01} step="0.01" required />
              </div>
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select name="unit" defaultValue="ton">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ton">Ton</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="crate">Crate</SelectItem>
                    <SelectItem value="bag">Bag (100kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pricePerUnit">Price per unit (π) *</Label>
                <Input id="pricePerUnit" name="pricePerUnit" type="number" min={0.001} max={0.1} step="0.001" required />
                <p className="mt-1 text-xs text-muted-foreground">Price must be 0.001 to 0.1 Pi per Pi policy</p>
              </div>
              <div>
                <Label htmlFor="harvestDate">Harvest date</Label>
                <Input id="harvestDate" name="harvestDate" type="date" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} placeholder="Grown organically in..." />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full gradient-brand text-primary-foreground">
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
