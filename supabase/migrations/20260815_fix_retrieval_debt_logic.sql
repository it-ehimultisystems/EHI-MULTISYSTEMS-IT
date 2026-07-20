-- Fix the retrieval logic to differentiate between the value of the goods retrieved (retrieved_value)
-- and the actual money sent to the customer's wallet (wallet_refund), which depends on how much they actually paid.

-- Postgres refuses CREATE OR REPLACE when the OUT-parameter row type
-- changes ("cannot change return type of existing function") -- and it
-- does here: the version this migration replaces (20260810_wallet_
-- atomicity_and_isolation.sql) returns TABLE(out_wallet_id uuid,
-- new_balance numeric), while this one returns four columns under
-- different names. On a fresh database that's invisible (each version is
-- only ever created once, in filename order) -- it only bites a database
-- that already has the old signature installed, which every real
-- environment does. DROP first so CREATE always succeeds either way.
DROP FUNCTION IF EXISTS public.process_cargo_retrieval(text, boolean, numeric, numeric, numeric, text, uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.process_cargo_retrieval(
  p_entry_ref text,
  p_is_partial boolean,
  p_retrieved_value numeric,  -- <== THIS USED TO BE p_refund_amount
  p_retrieved_pieces numeric,
  p_retrieved_kg numeric,
  p_customer_name text,
  p_hub_id uuid,
  p_logged_by text,
  p_wallet_id uuid DEFAULT NULL
)
RETURNS TABLE (wallet_id uuid, new_balance numeric, wallet_refund numeric, debt_reduction numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_already numeric;
  v_new_status text;
  v_wallet_id uuid := p_wallet_id;
  v_txn_result RECORD;
  v_amount_paid numeric;
  v_unpaid_debt numeric;
  v_wallet_refund numeric;
  v_debt_reduction numeric;
BEGIN
  IF p_retrieved_value <= 0 THEN
    RAISE EXCEPTION 'Retrieved value must be positive (got %)', p_retrieved_value;
  END IF;

  SELECT id, amount, status, retrieved_amount, hub_id, amount_paid, receipt_mode
  INTO v_entry
  FROM public.cargo_entries
  WHERE entry_ref = p_entry_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo entry % not found', p_entry_ref;
  END IF;

  IF v_entry.hub_id IS NOT NULL
     AND v_entry.hub_id <> public.current_user_hub_id()
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to process a retrieval for this entry''s hub';
  END IF;

  v_already := COALESCE(v_entry.retrieved_amount, 0);
  IF v_already + p_retrieved_value > v_entry.amount THEN
    RAISE EXCEPTION 'Retrieval value % would exceed remaining retrievable amount (already retrieved % of %)',
      p_retrieved_value, v_already, v_entry.amount;
  END IF;

  v_new_status := CASE WHEN v_already + p_retrieved_value >= v_entry.amount THEN 'Retrieved' ELSE v_entry.status END;

  -- Determine how much of this entry was actually already paid for.
  -- amount_paid is only ever populated for 'Debt' entries (see EHIApp.tsx's
  -- cargo insert payload, which never sets amount_paid for any other mode)
  -- -- every other valid receipt_mode is settled in full at intake. This
  -- must be the FULL list from cargo_entries_receipt_mode_check
  -- (20260717_cargo_workflow_overhaul.sql), not a partial guess: an earlier
  -- version of this function only listed 4 of the 6 non-Debt modes, so a
  -- 'TransferCash' or 'Complementary' retrieval fell into the ELSE branch,
  -- computed v_amount_paid = 0, and silently zeroed the wallet refund for
  -- money the customer had already paid.
  IF v_entry.receipt_mode IN ('Cash', 'Transfer', 'TransferCash', 'POS', 'Wallet', 'Complementary') THEN
    v_amount_paid := v_entry.amount;
  ELSE
    v_amount_paid := COALESCE(v_entry.amount_paid, 0);
  END IF;

  v_unpaid_debt := v_entry.amount - v_amount_paid - v_already;
  IF v_unpaid_debt < 0 THEN v_unpaid_debt := 0; END IF;

  -- The retrieved value first pays off the unpaid debt, and any remainder is refunded to the wallet
  v_debt_reduction := LEAST(p_retrieved_value, v_unpaid_debt);
  v_wallet_refund := p_retrieved_value - v_debt_reduction;

  UPDATE public.cargo_entries SET
    retrieved_pieces = COALESCE(retrieved_pieces, 0) + p_retrieved_pieces,
    retrieved_kg     = COALESCE(retrieved_kg, 0) + p_retrieved_kg,
    retrieved_amount = v_already + p_retrieved_value,
    retrieved        = (v_already + p_retrieved_value >= v_entry.amount),
    retrieved_at     = now(),
    retrieved_by     = p_logged_by,
    retrieval_note   = COALESCE(retrieval_note || E'\n', '') ||
                        format('%s retrieval: %s pcs / %s kg, %s debt cleared, %s refunded to wallet',
                          CASE WHEN p_is_partial THEN 'Partial' ELSE 'Full' END,
                          p_retrieved_pieces, p_retrieved_kg, v_debt_reduction, v_wallet_refund),
    status           = v_new_status
  WHERE entry_ref = p_entry_ref;

  -- Only interact with the wallet if there is actual money to refund
  IF v_wallet_refund > 0 THEN
    IF v_wallet_id IS NULL THEN
      SELECT id INTO v_wallet_id FROM public.customer_wallets
      WHERE lower(customer_name) = lower(p_customer_name)
      LIMIT 1;
    END IF;

    IF v_wallet_id IS NULL THEN
      INSERT INTO public.customer_wallets (
        hub_id, customer_name, opening_balance, balance,
        total_topped_up, total_used, source_type, source_ref, source_note,
        status, created_by
      ) VALUES (
        p_hub_id, p_customer_name, 0, 0,
        0, 0, 'airline_retrieval', p_entry_ref,
        format('Credit from %sretrieved cargo %s', CASE WHEN p_is_partial THEN 'partial ' ELSE '' END, p_entry_ref),
        'active', p_logged_by
      ) RETURNING id INTO v_wallet_id;
    END IF;

    SELECT * INTO v_txn_result FROM public.apply_wallet_transaction(
      v_wallet_id, 'refund', v_wallet_refund, p_entry_ref, v_entry.id,
      format('Airline %sretrieval refund for %s', CASE WHEN p_is_partial THEN 'partial ' ELSE '' END, p_entry_ref),
      p_logged_by
    );

    RETURN QUERY SELECT v_wallet_id, v_txn_result.new_balance, v_wallet_refund, v_debt_reduction;
  ELSE
    -- No wallet transaction occurred -- still report the split so the
    -- caller can show an accurate "debt cleared" confirmation.
    RETURN QUERY SELECT v_wallet_id, 0::numeric, v_wallet_refund, v_debt_reduction;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_cargo_retrieval(text, boolean, numeric, numeric, numeric, text, uuid, text, uuid) TO authenticated;
