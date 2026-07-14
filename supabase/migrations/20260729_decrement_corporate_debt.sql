-- increment_corporate_debt (20260719_atomic_corporate_debt.sql) is the only
-- write path for corporate_clients.accumulated_monthly_debt -- nothing has
-- ever decremented it, even when a corporate client's shipment debt is
-- actually paid down via DebtorsTab.handleRecordPayment. That flow already
-- updates the transaction's own amountPaid/paymentHistory; it just never
-- reduced the client's aggregate monthly balance, so PricingConfiguration's
-- "₦X owed" display could only ever go up. This is the symmetric decrement,
-- mirroring increment_corporate_debt's exact locking/security pattern
-- (single atomic UPDATE for row-level serialization, SECURITY DEFINER with
-- an explicit hub-scoping re-check since SECURITY DEFINER bypasses RLS).
-- Clamped at zero (GREATEST) so no sequence of payments can push a client's
-- balance negative, e.g. from a rounding mismatch or a duplicate call.

CREATE OR REPLACE FUNCTION public.decrement_corporate_debt(p_client_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total numeric;
  v_client_hub uuid;
BEGIN
  SELECT hub_id INTO v_client_hub FROM public.corporate_clients WHERE id = p_client_id;
  IF v_client_hub IS NOT NULL
     AND v_client_hub <> public.current_user_hub_id()
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to update this corporate client''s debt balance';
  END IF;

  UPDATE public.corporate_clients
  SET accumulated_monthly_debt = GREATEST(accumulated_monthly_debt - p_amount, 0)
  WHERE id = p_client_id
  RETURNING accumulated_monthly_debt INTO v_new_total;

  RETURN v_new_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_corporate_debt(uuid, numeric) TO authenticated;
