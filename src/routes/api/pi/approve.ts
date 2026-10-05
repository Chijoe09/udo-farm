import { createFileRoute } from "@tanstack/react-router";
import { handlePiApprove } from "../public/pi.approve";

export const Route = createFileRoute("/api/pi/approve")({
  server: {
    handlers: {
      POST: ({ request }) => handlePiApprove(request),
    },
  },
});
