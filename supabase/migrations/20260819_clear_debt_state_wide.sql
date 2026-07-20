-- ============================================================
-- STATE-WIDE DEBT CLEARING — cargo/baggage/marketing/package
-- ============================================================
-- 20260817_state_visibility.sql widened the READ policies for
-- cargo_entries/manifests/marketing_entries/package_entries to
-- sibling_hub_ids(), so an agent now sees debts from every hub in
-- their state. The WRITE (UPDATE) policies on these tables
-- (20260708_hub_isolation_rls.sql, 20260709_package_desk.sql) were
-- never widened to match -- they still require hub_id =
-- current_user_hub_id() exactly, or is_hub_unrestricted() (which
-- cargo_agent/baggage_agent/marketing_agent are not part of). A
-- non-admin agent clearing a sibling-hub debt therefore hit a
-- silent 0-rows-affected UPDATE (RLS filtered it out -- not an
-- error, just a no-op), while the client-side code
-- (TransactionLedger.tsx's handleClearDebt, DebtorsTab.tsx's
-- handleRecordPayment) showed "Debt cleared successfully"
-- unconditionally regardless of what the database actually did.
--
-- Rather than widen the general UPDATE policy (which would open
-- every field on these tables to cross-hub edits, not just debt
-- clearing), this adds one narrow, purpose-built function per
-- table -- same SECURITY DEFINER + internal-authorization-check
-- pattern already used by process_cargo_retrieval()/
-- apply_wallet_transaction()/increment_corporate_debt(). Each
-- function can only touch a Debt-mode entry's payment fields, is
-- explicitly authorized state-wide (sibling_hub_ids()) for this one
-- action, and either succeeds or raises a real exception -- no more
-- silent no-ops.
--
-- Four separate functions rather than one generic one: the four
-- tables disagree on id column (entry_ref vs manifests'
-- transaction_id), disagree on which column tracks amount paid
-- toward the debt (amount_paid, except marketing_entries -- see the
-- comment on clear_marketing_debt below), and package_entries has
-- extra debt_paid/debt_paid_at booleans nothing else has. A single
-- dynamic-SQL function juggling all of that would be more fragile
-- than four small, explicit ones.

-- ─── CARGO ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_cargo_debt(
  p_entry_ref     text,
  p_payment_amount numeric,
  p_payment_mode  text,
  p_bank          text DEFAULT NULL,
  p_logged_by     text DEFAULT NULL
)
RETURNS TABLE (new_amount_paid numeric, remaining_balance numeric, fully_paid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_new_amount_paid numeric;
  v_remaining numeric;
BEGIN
  IF p_payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive (got %)', p_payment_amount;
  END IF;

  SELECT hub_id, amount, amount_paid, retrieved_amount, receipt_mode
  INTO v_entry
  FROM public.cargo_entries
  WHERE entry_ref = p_entry_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo entry % not found', p_entry_ref;
  END IF;

  IF v_entry.receipt_mode <> 'Debt' THEN
    RAISE EXCEPTION 'Entry % is not a Debt-mode entry', p_entry_ref;
  END IF;

  -- State-wide for debt-clearing specifically -- any agent who can
  -- SEE this debt (sibling_hub_ids(), matching the read policy) can
  -- collect against it. Every other write on this table stays
  -- hub-locked; this is the one deliberate exception.
  IF v_entry.hub_id IS NOT NULL
     AND v_entry.hub_id <> ALL(public.sibling_hub_ids())
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to clear debt for this entry''s hub';
  END IF;

  -- Balance formula matches DebtorsTab.tsx exactly: amount - amountPaid
  -- - retrieved_amount (a partial retrieval already reduces what's
  -- actually still owed, separately from amount_paid).
  v_remaining := v_entry.amount - COALESCE(v_entry.amount_paid, 0) - COALESCE(v_entry.retrieved_amount, 0);
  IF p_payment_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment of % would exceed remaining balance of %', p_payment_amount, v_remaining;
  END IF;

  v_new_amount_paid := COALESCE(v_entry.amount_paid, 0) + p_payment_amount;
  v_remaining := v_remaining - p_payment_amount;

  -- receipt_mode intentionally stays 'Debt' -- 'Debt Paid' is a
  -- client-side-derived label (see handleUpdateTx's
  -- `tx.mode === 'Debt Paid' ? 'Debt' : tx.mode`), not a real value
  -- in cargo_entries_receipt_mode_check. "Fully paid" is represented
  -- by amount_paid reaching amount, not by changing this column.
  UPDATE public.cargo_entries SET
    amount_paid = v_new_amount_paid,
    payment_history = COALESCE(payment_history, '[]'::jsonb) ||
      jsonb_build_object('amount', p_payment_amount, 'mode', p_payment_mode, 'by', COALESCE(p_logged_by, 'system'), 'at', now()),
    bank = COALESCE(p_bank, bank),
    payment_confirmed = CASE WHEN v_remaining <= 0 THEN true ELSE payment_confirmed END,
    confirmed_by = CASE WHEN v_remaining <= 0 THEN COALESCE(p_logged_by, confirmed_by) ELSE confirmed_by END,
    confirmed_at = CASE WHEN v_remaining <= 0 THEN now() ELSE confirmed_at END
  WHERE entry_ref = p_entry_ref;

  RETURN QUERY SELECT v_new_amount_paid, GREATEST(v_remaining, 0), (v_remaining <= 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_cargo_debt(text, numeric, text, text, text) TO authenticated;

-- ─── BAGGAGE (manifests) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_baggage_debt(
  p_transaction_id text,
  p_payment_amount numeric,
  p_payment_mode   text,
  p_bank           text DEFAULT NULL,
  p_logged_by      text DEFAULT NULL
)
RETURNS TABLE (new_amount_paid numeric, remaining_balance numeric, fully_paid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_new_amount_paid numeric;
  v_remaining numeric;
BEGIN
  IF p_payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive (got %)', p_payment_amount;
  END IF;

  SELECT hub_id, amount, amount_paid, payment_mode
  INTO v_entry
  FROM public.manifests
  WHERE transaction_id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baggage entry % not found', p_transaction_id;
  END IF;

  IF v_entry.payment_mode <> 'Debt' THEN
    RAISE EXCEPTION 'Entry % is not a Debt-mode entry', p_transaction_id;
  END IF;

  IF v_entry.hub_id IS NOT NULL
     AND v_entry.hub_id <> ALL(public.sibling_hub_ids())
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to clear debt for this entry''s hub';
  END IF;

  v_remaining := v_entry.amount - COALESCE(v_entry.amount_paid, 0);
  IF p_payment_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment of % would exceed remaining balance of %', p_payment_amount, v_remaining;
  END IF;

  v_new_amount_paid := COALESCE(v_entry.amount_paid, 0) + p_payment_amount;
  v_remaining := v_remaining - p_payment_amount;

  UPDATE public.manifests SET
    amount_paid = v_new_amount_paid,
    payment_history = COALESCE(payment_history, '[]'::jsonb) ||
      jsonb_build_object('amount', p_payment_amount, 'mode', p_payment_mode, 'by', COALESCE(p_logged_by, 'system'), 'at', now()),
    bank = COALESCE(p_bank, bank),
    payment_confirmed = CASE WHEN v_remaining <= 0 THEN true ELSE payment_confirmed END,
    confirmed_by = CASE WHEN v_remaining <= 0 THEN COALESCE(p_logged_by, confirmed_by) ELSE confirmed_by END,
    confirmed_at = CASE WHEN v_remaining <= 0 THEN now() ELSE confirmed_at END
  WHERE transaction_id = p_transaction_id;

  RETURN QUERY SELECT v_new_amount_paid, GREATEST(v_remaining, 0), (v_remaining <= 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_baggage_debt(text, numeric, text, text, text) TO authenticated;

-- ─── MARKETING ──────────────────────────────────────────────
-- marketing_entries has an inverted naming convention from every
-- other table here (see 20260710_debt_payment_columns.sql): its
-- `amount` column is unused, the transaction's real sale total is
-- stored in `amount_paid` (Transaction.amount is read from
-- amount_paid for marketing rows -- see handleUpdateTx's
-- `if (table === 'marketing_entries') { updatePayload.amount_paid = t.amount; }`),
-- and running debt-repayment tracking uses its own separate
-- `debt_amount_paid` column instead. Using `amount_paid` for debt
-- tracking here (like the other three tables) would silently
-- overwrite the real sale amount every time a payment is recorded.
CREATE OR REPLACE FUNCTION public.clear_marketing_debt(
  p_entry_ref      text,
  p_payment_amount numeric,
  p_payment_mode   text,
  p_bank           text DEFAULT NULL,
  p_logged_by      text DEFAULT NULL
)
RETURNS TABLE (new_debt_amount_paid numeric, remaining_balance numeric, fully_paid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_new_debt_amount_paid numeric;
  v_remaining numeric;
BEGIN
  IF p_payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive (got %)', p_payment_amount;
  END IF;

  SELECT hub_id, amount_paid AS sale_amount, debt_amount_paid, payment_mode
  INTO v_entry
  FROM public.marketing_entries
  WHERE entry_ref = p_entry_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marketing entry % not found', p_entry_ref;
  END IF;

  IF v_entry.payment_mode <> 'Debt' THEN
    RAISE EXCEPTION 'Entry % is not a Debt-mode entry', p_entry_ref;
  END IF;

  IF v_entry.hub_id IS NOT NULL
     AND v_entry.hub_id <> ALL(public.sibling_hub_ids())
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to clear debt for this entry''s hub';
  END IF;

  v_remaining := v_entry.sale_amount - COALESCE(v_entry.debt_amount_paid, 0);
  IF p_payment_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment of % would exceed remaining balance of %', p_payment_amount, v_remaining;
  END IF;

  v_new_debt_amount_paid := COALESCE(v_entry.debt_amount_paid, 0) + p_payment_amount;
  v_remaining := v_remaining - p_payment_amount;

  UPDATE public.marketing_entries SET
    debt_amount_paid = v_new_debt_amount_paid,
    payment_history = COALESCE(payment_history, '[]'::jsonb) ||
      jsonb_build_object('amount', p_payment_amount, 'mode', p_payment_mode, 'by', COALESCE(p_logged_by, 'system'), 'at', now()),
    bank = COALESCE(p_bank, bank),
    payment_confirmed = CASE WHEN v_remaining <= 0 THEN true ELSE payment_confirmed END,
    confirmed_by = CASE WHEN v_remaining <= 0 THEN COALESCE(p_logged_by, confirmed_by) ELSE confirmed_by END,
    confirmed_at = CASE WHEN v_remaining <= 0 THEN now() ELSE confirmed_at END
  WHERE entry_ref = p_entry_ref;

  RETURN QUERY SELECT v_new_debt_amount_paid, GREATEST(v_remaining, 0), (v_remaining <= 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_marketing_debt(text, numeric, text, text, text) TO authenticated;

-- ─── PACKAGE ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_package_debt(
  p_entry_ref      text,
  p_payment_amount numeric,
  p_payment_mode   text,
  p_bank           text DEFAULT NULL,
  p_logged_by      text DEFAULT NULL
)
RETURNS TABLE (new_amount_paid numeric, remaining_balance numeric, fully_paid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_new_amount_paid numeric;
  v_remaining numeric;
BEGIN
  IF p_payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive (got %)', p_payment_amount;
  END IF;

  SELECT hub_id, amount, amount_paid, payment_mode
  INTO v_entry
  FROM public.package_entries
  WHERE entry_ref = p_entry_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package entry % not found', p_entry_ref;
  END IF;

  IF v_entry.payment_mode <> 'Debt' THEN
    RAISE EXCEPTION 'Entry % is not a Debt-mode entry', p_entry_ref;
  END IF;

  IF v_entry.hub_id IS NOT NULL
     AND v_entry.hub_id <> ALL(public.sibling_hub_ids())
     AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to clear debt for this entry''s hub';
  END IF;

  v_remaining := v_entry.amount - COALESCE(v_entry.amount_paid, 0);
  IF p_payment_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment of % would exceed remaining balance of %', p_payment_amount, v_remaining;
  END IF;

  v_new_amount_paid := COALESCE(v_entry.amount_paid, 0) + p_payment_amount;
  v_remaining := v_remaining - p_payment_amount;

  UPDATE public.package_entries SET
    amount_paid = v_new_amount_paid,
    payment_history = COALESCE(payment_history, '[]'::jsonb) ||
      jsonb_build_object('amount', p_payment_amount, 'mode', p_payment_mode, 'by', COALESCE(p_logged_by, 'system'), 'at', now()),
    bank = COALESCE(p_bank, bank),
    payment_confirmed = CASE WHEN v_remaining <= 0 THEN true ELSE payment_confirmed END,
    confirmed_by = CASE WHEN v_remaining <= 0 THEN COALESCE(p_logged_by, confirmed_by) ELSE confirmed_by END,
    confirmed_at = CASE WHEN v_remaining <= 0 THEN now() ELSE confirmed_at END,
    debt_paid = CASE WHEN v_remaining <= 0 THEN true ELSE debt_paid END,
    debt_paid_at = CASE WHEN v_remaining <= 0 THEN now() ELSE debt_paid_at END
  WHERE entry_ref = p_entry_ref;

  RETURN QUERY SELECT v_new_amount_paid, GREATEST(v_remaining, 0), (v_remaining <= 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_package_debt(text, numeric, text, text, text) TO authenticated;
