import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  paymentId: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/),
  txid: z.string().min(1).max(256),
  orderId: z.string().uuid(),
});

export const Route = createFileRoute("/api/public/pi/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PI_API_KEY;
        if (!apiKey) return new Response("PI_API_KEY not configured", { status: 500 });
        const walletAddress = process.env.PI_WALLET_ADDRESS;
        if (!walletAddress) return new Response("PI_WALLET_ADDRESS not configured", { status: 500 });
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid payment completion request", { status: 400 });
        const { paymentId, txid, orderId } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin.from("orders")
          .select("id,buyer_id,product_id,quantity,total_price_pi,status")
          .eq("id", orderId).maybeSingle();
        if (!order || !["PENDING_PAYMENT", "PAID"].includes(order.status)) {
          return new Response("Order is not awaiting payment", { status: 400 });
        }
        const { data: product } = await supabaseAdmin.from("products")
          .select("price_per_unit,live_inventory").eq("id", order.product_id).maybeSingle();
        if (!product || Number(product.price_per_unit) < 0.001 || Number(product.price_per_unit) > 0.1) {
          return new Response("Product price is outside Pi policy", { status: 400 });
        }
        const expectedAmount = Number(order.total_price_pi);
        const expectedTotal = Number((Number(product.price_per_unit) * Number(order.quantity)).toFixed(7));
        if (Math.abs(expectedAmount - expectedTotal) > 0.0000001) return new Response("Order amount does not match product price", { status: 400 });

        const verifyRes = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}`, {
          headers: { Authorization: `Key ${apiKey}` },
        });
        if (!verifyRes.ok) return new Response("Could not verify payment with Pi", { status: 502 });
        const verifiedPayment = await verifyRes.json() as {
          amount?: number; to_address?: string; user_uid?: string; uid?: string;
          user?: { uid?: string }; metadata?: Record<string, unknown>;
          transaction?: { txid?: string };
        };
        const piUid = verifiedPayment.user?.uid ?? verifiedPayment.user_uid ?? verifiedPayment.uid;
        const { data: profile } = await supabaseAdmin.from("profiles").select("pi_user_id").eq("id", order.buyer_id).maybeSingle();
        if (Number(verifiedPayment.amount) !== expectedAmount) return new Response("Payment amount does not match order", { status: 400 });
        if (verifiedPayment.to_address !== walletAddress) return new Response("Payment recipient does not match configured wallet", { status: 400 });
        if (!piUid || !profile?.pi_user_id || piUid !== profile.pi_user_id) return new Response("Pi payer does not match buyer", { status: 400 });
        if (verifiedPayment.metadata?.orderId !== orderId) return new Response("Payment metadata does not match order", { status: 400 });
        if (verifiedPayment.transaction?.txid && verifiedPayment.transaction.txid !== txid) return new Response("Transaction ID does not match Pi payment", { status: 400 });

        const res = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/complete`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ txid }),
          },
        );
        if (!res.ok) {
          const text = await res.text();
          return new Response(`Pi complete failed: ${text}`, { status: 502 });
        }
        const piPayment = (await res.json()) as {
          amount?: number;
          memo?: string;
          metadata?: Record<string, unknown>;
        };
        if (Number(piPayment.amount) !== expectedAmount) return new Response("Completed amount does not match order", { status: 400 });
        const { error: completionError } = await supabaseAdmin.rpc("complete_pi_order", {
          p_order_id: orderId,
          p_pi_payment_id: paymentId,
          p_txid: txid,
          p_amount: piPayment.amount ?? expectedAmount,
          p_memo: piPayment.memo ?? null,
          p_metadata: piPayment.metadata ?? null,
        });
        if (completionError) return new Response("Payment completed, but order recording failed", { status: 500 });

        return Response.json({ ok: true });
      },
    },
  },
});
