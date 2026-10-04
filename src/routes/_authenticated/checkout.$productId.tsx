import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { piCreatePayment } from "@/lib/pi";
import { Truck, MapPin, ShieldCheck } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ apply: z.boolean().optional() });

export const Route = createFileRoute("/_authenticated/checkout/$productId")({
  head: () => ({ meta: [{ title: "Checkout — UDO Farm" }] }),
  validateSearch: searchSchema,
  component: Checkout,
});

const DELIVERY_FEE = 0;

function Checkout() {
  const { productId } = Route.useParams();
  const { userId } = useSession();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["checkout", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*,profiles:farmer_id(pi_username)")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !product) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl p-8"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>
      </AppShell>
    );
  }

  const p = product;
  const unitPrice = Number(p.price_per_unit) || 0;
  const subtotal = unitPrice * quantity;
  const deliveryFee = deliveryType === "DELIVERY" ? DELIVERY_FEE : 0;
  const total = Number((subtotal + deliveryFee).toFixed(7));

  async function pay() {
    if (!userId) return;
    if (!Number.isFinite(unitPrice) || unitPrice < 0.001 || unitPrice > 0.1) {
      toast.error("Price must be 0.001 to 0.1 Pi per Pi policy");
      return;
    }
    if (quantity > Number(p.live_inventory)) {
      toast.error(`Only ${p.live_inventory} ${p.unit}s available`);
      return;
    }
    if (deliveryType === "DELIVERY" && !address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    setProcessing(true);
    try {
      // 1. Create order (PENDING_PAYMENT)
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          buyer_id: userId,
          product_id: p.id,
          quantity,
          total_price_pi: total,
          delivery_type: deliveryType,
          delivery_address: deliveryType === "DELIVERY" ? address : null,
          delivery_fee_pi: deliveryFee,
          notes: notes || null,
          status: "PENDING_PAYMENT",
        })
        .select("id")
        .single();
      if (orderErr || !order) throw orderErr ?? new Error("Order failed");

      await piCreatePayment(
        {
          amount: total,
          memo: `UDO Farm: ${p.title}`,
          metadata: { orderId: order.id, productId: p.id },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            const response = await fetch("/api/public/pi/approve", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ paymentId, orderId: order.id }),
            });
            if (!response.ok) throw new Error(await response.text());
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            const response = await fetch("/api/public/pi/complete", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ paymentId, txid, orderId: order.id }),
            });
            if (!response.ok) throw new Error(await response.text());
            toast.success("Payment complete!");
            navigate({ to: "/orders" });
          },
          onCancel: () => {
            toast.error("Payment cancelled");
            setProcessing(false);
          },
          onError: (err) => {
            toast.error(`Payment error: ${err.message}`);
            setProcessing(false);
          },
        },
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Payment failed");
      setProcessing(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-muted-foreground">Review and pay with Pi.</p>

        <Card className="mt-6 overflow-hidden">
          <div className="flex gap-4 border-b border-border bg-muted/30 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">
                @{(p.profiles as unknown as { pi_username: string } | null)?.pi_username} · {p.price_per_unit} π / {p.unit}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <Label htmlFor="qty">Quantity ({p.unit}s)</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                max={Number(p.live_inventory)}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Max available: {p.live_inventory}</p>
            </div>

            <div>
              <Label className="mb-2 block">Delivery</Label>
              <RadioGroup
                value={deliveryType}
                onValueChange={(v) => setDeliveryType(v as "PICKUP" | "DELIVERY")}
                className="grid grid-cols-2 gap-3"
              >
                <label className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 ${deliveryType === "PICKUP" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="PICKUP" className="sr-only" />
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Pickup at farm</p>
                    <p className="text-xs text-muted-foreground">Free</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 ${deliveryType === "DELIVERY" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="DELIVERY" className="sr-only" />
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Delivery to you</p>
                    <p className="text-xs text-muted-foreground">+{DELIVERY_FEE} π</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {deliveryType === "DELIVERY" && (
              <div>
                <Label htmlFor="addr">Delivery address</Label>
                <Textarea id="addr" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} required />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="space-y-2 border-t border-border bg-muted/20 p-5 text-sm">
            <Row label={`${quantity} × ${p.title}`} value={`${fmtPi(subtotal)} π`} />
            <Row label="Delivery" value={`${fmtPi(deliveryFee)} π`} />
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold">
              <span>Total</span>
              <span>{fmtPi(total)} π</span>
            </div>
          </div>

          <div className="p-5 pt-0">
            <Button
              onClick={pay}
              disabled={processing}
              size="lg"
              className="h-14 w-full gradient-brand text-base font-semibold text-primary-foreground"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {processing ? "Processing..." : `Pay ${fmtPi(total)} π with Pi`}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Payments are verified server-side against the Pi Network.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function fmtPi(n: number) {
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";
  // Show up to 7 decimals, strip trailing zeros; ensure tiny amounts aren't rounded to 0.00
  const s = n.toFixed(7).replace(/\.?0+$/, "");
  return s || "0";
}

