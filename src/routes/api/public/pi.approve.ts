import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pi/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PI_API_KEY;
        if (!apiKey) return new Response("PI_API_KEY not configured", { status: 500 });

        const { paymentId, orderId } = (await request.json()) as {
          paymentId?: string;
          orderId?: string;
        };
        if (!paymentId) return new Response("Missing paymentId", { status: 400 });

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

        // Payment row is inserted on completion; approve just OKs with Pi.
        void orderId;
        return Response.json({ ok: true });
      },
    },
  },
});
