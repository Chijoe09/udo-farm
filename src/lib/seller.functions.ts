import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const clearStaleSellerOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("clear_stale_seller_orders");
    if (error) throw new Error(error.message);
    return { deletedCount: data ?? 0 };
  });