-- lovable-cron-fallback-reviewed: User requested automatic 10-minute order expiry with up to one-minute cancellation delay.
ALTER TABLE public.orders
  ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  ADD COLUMN stock_reserved boolean NOT NULL DEFAULT false;

UPDATE public.orders
SET expires_at = created_at + interval '10 minutes',
    stock_reserved = false;

CREATE INDEX orders_pending_expiry_idx
  ON public.orders (expires_at)
  WHERE status = 'PENDING_PAYMENT';

CREATE OR REPLACE FUNCTION public.reserve_pi_order(
  p_product_id uuid,
  p_quantity numeric,
  p_total_price_pi numeric,
  p_delivery_type public.delivery_type,
  p_delivery_address text,
  p_delivery_fee_pi numeric,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  buyer uuid := auth.uid();
  product_row public.products%ROWTYPE;
  order_id uuid;
  expected_total numeric;
BEGIN
  IF buyer IS NULL OR NOT public.has_role(buyer, 'buyer'::public.app_role) THEN
    RAISE EXCEPTION 'Buyer sign-in is required';
  END IF;
  IF p_quantity <= 0 OR p_total_price_pi <= 0 OR p_delivery_fee_pi < 0 THEN
    RAISE EXCEPTION 'Invalid order amount or quantity';
  END IF;

  SELECT * INTO product_row
  FROM public.products
  WHERE id = p_product_id AND status = 'APPROVED'::public.product_status
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product is not available'; END IF;
  IF product_row.price_per_unit < 0.001 OR product_row.price_per_unit > 0.1 THEN
    RAISE EXCEPTION 'Product price is outside Pi policy';
  END IF;
  IF product_row.live_inventory < p_quantity THEN RAISE EXCEPTION 'Insufficient inventory'; END IF;

  expected_total := round(product_row.price_per_unit * p_quantity + p_delivery_fee_pi, 7);
  IF abs(p_total_price_pi - expected_total) > 0.0000001 THEN
    RAISE EXCEPTION 'Order amount does not match product price';
  END IF;
  IF p_delivery_type = 'DELIVERY'::public.delivery_type AND nullif(trim(p_delivery_address), '') IS NULL THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  UPDATE public.products
  SET live_inventory = live_inventory - p_quantity, updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.orders (
    buyer_id, product_id, quantity, total_price_pi, delivery_type,
    delivery_address, delivery_fee_pi, notes, status, expires_at, stock_reserved
  ) VALUES (
    buyer, p_product_id, p_quantity, p_total_price_pi, p_delivery_type,
    CASE WHEN p_delivery_type = 'DELIVERY'::public.delivery_type THEN p_delivery_address ELSE NULL END,
    p_delivery_fee_pi, p_notes, 'PENDING_PAYMENT'::public.order_status,
    now() + interval '10 minutes', true
  ) RETURNING id INTO order_id;
  RETURN order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_pending_pi_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  order_row public.orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR order_row.buyer_id <> auth.uid() OR order_row.status <> 'PENDING_PAYMENT'::public.order_status THEN
    RETURN false;
  END IF;
  IF order_row.stock_reserved THEN
    UPDATE public.products
    SET live_inventory = live_inventory + order_row.quantity, updated_at = now()
    WHERE id = order_row.product_id;
  END IF;
  UPDATE public.orders
  SET status = 'CANCELLED'::public.order_status, stock_reserved = false, updated_at = now()
  WHERE id = p_order_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  order_row public.orders%ROWTYPE;
  expired_count integer := 0;
BEGIN
  FOR order_row IN
    SELECT * FROM public.orders
    WHERE status = 'PENDING_PAYMENT'::public.order_status AND expires_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    IF order_row.stock_reserved THEN
      UPDATE public.products
      SET live_inventory = live_inventory + order_row.quantity, updated_at = now()
      WHERE id = order_row.product_id;
    END IF;
    UPDATE public.orders
    SET status = 'CANCELLED'::public.order_status, stock_reserved = false, updated_at = now()
    WHERE id = order_row.id;
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_stale_seller_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  order_row public.orders%ROWTYPE;
  caller uuid := auth.uid();
  deleted_count integer := 0;
BEGIN
  IF caller IS NULL OR NOT (
    public.has_role(caller, 'farmer'::public.app_role)
    OR public.has_role(caller, 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Seller access is required';
  END IF;

  FOR order_row IN
    SELECT o.* FROM public.orders o
    JOIN public.products p ON p.id = o.product_id
    WHERE p.farmer_id = caller
      AND o.status = 'PENDING_PAYMENT'::public.order_status
      AND o.created_at < now() - interval '24 hours'
      AND NOT EXISTS (SELECT 1 FROM public.payments pay WHERE pay.order_id = o.id)
    FOR UPDATE OF o
  LOOP
    IF order_row.stock_reserved THEN
      UPDATE public.products
      SET live_inventory = live_inventory + order_row.quantity, updated_at = now()
      WHERE id = order_row.product_id;
    END IF;
    DELETE FROM public.orders WHERE id = order_row.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_pi_order(
  p_order_id uuid,
  p_pi_payment_id text,
  p_txid text,
  p_amount numeric,
  p_memo text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  order_row public.orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF order_row.status = 'PAID'::public.order_status THEN
    IF EXISTS (
      SELECT 1 FROM public.payments
      WHERE order_id = p_order_id AND pi_payment_id = p_pi_payment_id AND txid = p_txid
    ) THEN RETURN; END IF;
    RAISE EXCEPTION 'Order already paid';
  END IF;
  IF order_row.status <> 'PENDING_PAYMENT'::public.order_status THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;
  IF order_row.expires_at <= now() THEN RAISE EXCEPTION 'Order expired'; END IF;

  IF NOT order_row.stock_reserved THEN
    UPDATE public.products
    SET live_inventory = live_inventory - order_row.quantity, updated_at = now()
    WHERE id = order_row.product_id AND live_inventory >= order_row.quantity;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient inventory'; END IF;
  END IF;

  INSERT INTO public.payments (pi_payment_id, txid, amount, status, order_id, user_id, memo, metadata)
  VALUES (p_pi_payment_id, p_txid, p_amount, 'COMPLETED', p_order_id, order_row.buyer_id, p_memo, p_metadata)
  ON CONFLICT (pi_payment_id) DO NOTHING;

  UPDATE public.orders
  SET status = 'PAID'::public.order_status, stock_reserved = false, updated_at = now()
  WHERE id = p_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_pi_order(uuid, numeric, numeric, public.delivery_type, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_pi_order(uuid, numeric, numeric, public.delivery_type, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_pi_order(uuid, numeric, numeric, public.delivery_type, text, numeric, text) TO service_role;
REVOKE ALL ON FUNCTION public.cancel_pending_pi_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_pending_pi_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pending_pi_order(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.expire_pending_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO postgres;
REVOKE ALL ON FUNCTION public.clear_stale_seller_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_stale_seller_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_stale_seller_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_pi_order(uuid, text, text, numeric, text, jsonb) TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $schedule$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'udo-expire-pending-orders') THEN
    PERFORM cron.schedule('udo-expire-pending-orders', '* * * * *', 'SELECT public.expire_pending_orders()');
  END IF;
END;
$schedule$;