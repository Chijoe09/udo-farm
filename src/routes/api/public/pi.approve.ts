import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  paymentId: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/),
  orderId: z.string().uuid(),
});

async function verifyPiPayment(paymentId: string, orderId: string, apiKey: string, walletAddress: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin.from("orders")
    .select("id,buyer_id,product_id,quantity,total_price_pi,status,expires_at,stock_reserved,delivery_fee_pi")
    .eq("id", orderId).maybeSingle();
  if (!order || order.status !== "PENDING_PAYMENT") throw new Error("Order is not awaiting payment");
  if (new Date(order.expires_at).getTime() <= Date.now()) throw new Error("Order expired");
  const { data: product } = await supabaseAdmin.from("products")
    .select("price_per_unit,live_inventory").eq("id", order.product_id).maybeSingle();
  if (!product || Number(product.price_per_unit) < 0.001 || Number(product.price_per_unit) > 0.1) {
    throw new Error("Product price is outside Pi policy");
  }
  if (!order.stock_reserved && Number(product.live_inventory) < Number(order.quantity)) throw new Error("Insufficient inventory");
  const expectedAmount = Number(order.total_price_pi);
  const productTotal = Number((Number(product.price_per_unit) * Number(order.quantity) + Number(order.delivery_fee_pi)).toFixed(7));
  if (!Number.isFinite(expectedAmount) || Math.abs(expectedAmount - productTotal) > 0.0000001) {
    throw new Error("Order amount does not match product price");
  }

  const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Key ${apiKey}` },
  });
  if (!response.ok) throw new Error("Could not verify payment with Pi");
  const payment = await response.json() as {
    amount?: number; to_address?: string; user_uid?: string; uid?: string;
    user?: { uid?: string }; metadata?: Record<string, unknown>;
  };
  const piUid = payment.user?.uid ?? payment.user_uid ?? payment.uid;
  const { data: profile } = await supabaseAdmin.from("profiles").select("pi_user_id").eq("id", order.buyer_id).maybeSingle();
  if (Number(payment.amount) !== expectedAmount) throw new Error("Payment amount does not match order");
  if (payment.to_address !== walletAddress) throw new Error("Payment recipient does not match configured wallet");
  if (!piUid || !profile?.pi_user_id || piUid !== profile.pi_user_id) throw new Error("Pi payer does not match buyer");
  if (payment.metadata?.orderId !== orderId) throw new Error("Payment metadata does not match order");
}

export async function handlePiApprove(request: Request): Promise<Response> {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return new Response("PI_API_KEY not configured", { status: 500 });
  const walletAddress = process.env.PI_WALLET_ADDRESS;
  if (!walletAddress) return new Response("PI_WALLET_ADDRESS not configured", { status: 500 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid payment request", { status: 400 });
  const { paymentId, orderId } = parsed.data;
  try {
    await verifyPiPayment(paymentId, orderId, apiKey, walletAddress);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Payment verification failed", { status: 400 });
  }

  const res = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/approve`,
    {
      method: "POST",
      headers: { Authorization: `Key ${apiKey}` },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return new Response(`Pi approve failed: ${text}`, { status: 502 });
  }

  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/public/pi/approve")({
  server: {
    handlers: {
      POST: ({ request }) => handlePiApprove(request),
    },
  },
});
