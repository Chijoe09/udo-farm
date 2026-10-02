ALTER TABLE public.products ADD CONSTRAINT products_pi_price_policy CHECK (price_per_unit >= 0.001 AND price_per_unit <= 0.1) NOT VALID;

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
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_row.status = 'PAID' THEN
    IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = p_order_id AND pi_payment_id = p_pi_payment_id AND txid = p_txid) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Order already paid';
  END IF;

  IF order_row.status <> 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;

  UPDATE public.products
  SET live_inventory = live_inventory - order_row.quantity,
      updated_at = now()
  WHERE id = order_row.product_id
    AND live_inventory >= order_row.quantity;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;

  INSERT INTO public.payments (pi_payment_id, txid, amount, status, order_id, user_id, memo, metadata)
  VALUES (p_pi_payment_id, p_txid, p_amount, 'COMPLETED', p_order_id, order_row.buyer_id, p_memo, p_metadata)
  ON CONFLICT (pi_payment_id) DO NOTHING;

  UPDATE public.orders SET status = 'PAID', updated_at = now() WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pi_order(uuid, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pi_order(uuid, text, text, numeric, text, jsonb) TO service_role;