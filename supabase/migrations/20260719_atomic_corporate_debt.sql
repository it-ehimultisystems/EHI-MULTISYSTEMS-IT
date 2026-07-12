-- Atomic corporate debt balance increment. CargoForm.tsx's corporate
-- gate-weighing finalize previously read accumulated_monthly_debt from a
-- client-side cache, added the new charge in JS, and wrote back the
-- absolute total -- a classic read-modify-write race. Two staff finalizing
-- different shipments for the SAME corporate client near-simultaneously
-- both read the same stale balance, and whichever write landed second
-- silently overwrote the first's increment (the individual cargo/ledger
-- transactions themselves stayed correct -- only the running debt total
-- on corporate_clients drifted). A single UPDATE ... SET col = col + x is
-- atomic under Postgres row locking: concurrent calls serialize correctly,
-- the second always adds on top of the first's already-applied result,
-- the same pattern next_awb_number() already uses for AWB sequences.
--
-- SECURITY DEFINER bypasses RLS, so the hub-scoping the direct-UPDATE RLS
-- policy on corporate_clients already enforces (20260716_security_hardening.sql)
-- is re-checked explicitly inside the function instead of silently
-- becoming more permissive than the policy it replaces for this one path.
CREATE OR REPLACE FUNCTION public.increment_corporate_debt(p_client_id uuid, p_amount numeric)
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
  SET accumulated_monthly_debt = accumulated_monthly_debt + p_amount
  WHERE id = p_client_id
  RETURNING accumulated_monthly_debt INTO v_new_total;

  RETURN v_new_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_corporate_debt(uuid, numeric) TO authenticated;
