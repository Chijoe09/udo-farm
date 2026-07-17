import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pi/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PI_API_KEY;
        if (!apiKey) return new Response("PI_API_KEY not configured", { status: 500 });

        const { paymentId, txid, orderId } = (await request.json()) as {
          paymentId?: string;
          txid?: string;
          orderId?: string;
        };
        if (!paymentId || !txid)
          return new Response("Missing paymentId or txid", { status: 400 });

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

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        if (orderId) {
          // Look up order for buyer + product info
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, buyer_id, product_id, quantity")
            .eq("id", orderId)
            .maybeSingle();

          if (!order?.buyer_id) {
            return new Response("Order not found", { status: 404 });
          }
          await supabaseAdmin.from("payments").upsert(
            {
              pi_payment_id: paymentId,
              txid,
              order_id: orderId,
              user_id: order.buyer_id,
              amount: piPayment.amount ?? 0,
              memo: piPayment.memo ?? null,
              metadata: (piPayment.metadata ?? {}) as never,
              status: "COMPLETED",
            },
            { onConflict: "pi_payment_id" },
          );

          await supabaseAdmin
            .from("orders")
            .update({ status: "PAID" })
            .eq("id", orderId);

          if (order?.product_id && order?.quantity) {
            const { data: product } = await supabaseAdmin
              .from("products")
              .select("live_inventory")
              .eq("id", order.product_id)
              .maybeSingle();
            if (product) {
              await supabaseAdmin
                .from("products")
                .update({
                  live_inventory: Math.max(
                    0,
                    Number(product.live_inventory) - Number(order.quantity),
                  ),
                })
                .eq("id", order.product_id);
            }
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
