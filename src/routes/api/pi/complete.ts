import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pi/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const response = await fetch(new URL("/api/public/pi/complete", request.url), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: await request.text(),
        });
        return response;
      },
    },
  },
});