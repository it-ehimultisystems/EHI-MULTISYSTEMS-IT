-- =============================================================
-- Reconcile Cleared Debts from Early Deployment (July 16th - 20th, 2026)
-- & Recalculate Corporate Monthly Debt Balances
-- =============================================================
-- In the first 4 days of deployment (July 16 - 20, 2026):
-- 1) Direct table UPDATEs hit RLS policies (20260708_hub_isolation_rls.sql)
--    which filtered cross-hub or unassigned updates with 0-rows-affected.
-- 2) package_entries had no amount_paid or payment_history columns
--    (added later in 20260719_package_payment_columns.sql).
-- 3) marketing_entries amount_paid (sale total) was sometimes written
--    instead of debt_amount_paid.
-- 4) Debt clearances wrote shadow rows (is_debt_clearance = true) without
--    updating the parent row's amount_paid / payment_history.
-- 5) Corporate clients' accumulated_monthly_debt was never decremented
--    prior to 20260729_decrement_corporate_debt.sql.
--
-- This migration safely backfills parent row payment histories & amounts paid
-- from historical shadow rows / package legacy flags, and recalculates
-- corporate monthly debt balances cleanly.
-- =============================================================

DO $$
DECLARE
  v_rec RECORD;
  v_sum numeric;
BEGIN

  -- -------------------------------------------------------------
  -- 1. CARGO ENTRIES: Backfill amount_paid & payment_history from shadow rows
  -- -------------------------------------------------------------
  FOR v_rec IN
    SELECT c.entry_ref, COALESCE(SUM(s.amount), 0) AS shadow_total, jsonb_agg(
      jsonb_build_object(
        'amount', s.amount,
        'mode', COALESCE(s.receipt_mode, 'Cash'),
        'by', COALESCE(s.entered_by::text, 'system'),
        'at', s.created_at
      ) ORDER BY s.created_at ASC
    ) AS shadow_history
    FROM public.cargo_entries c
    JOIN public.cargo_entries s ON s.related_tx_id = c.entry_ref AND s.is_debt_clearance = true
    WHERE c.receipt_mode = 'Debt'
    GROUP BY c.entry_ref
  LOOP
    UPDATE public.cargo_entries
    SET amount_paid = LEAST(amount, GREATEST(amount_paid, v_rec.shadow_total)),
        payment_history = CASE
          WHEN payment_history = '[]'::jsonb OR payment_history IS NULL THEN v_rec.shadow_history
          ELSE payment_history
        END
    WHERE entry_ref = v_rec.entry_ref;
  END LOOP;

  -- -------------------------------------------------------------
  -- 2. MANIFESTS (Baggage): Backfill amount_paid & payment_history from shadow rows
  -- -------------------------------------------------------------
  FOR v_rec IN
    SELECT m.transaction_id, COALESCE(SUM(s.amount), 0) AS shadow_total, jsonb_agg(
      jsonb_build_object(
        'amount', s.amount,
        'mode', COALESCE(s.payment_mode, 'Cash'),
        'by', COALESCE(s.entered_by::text, 'system'),
        'at', s.created_at
      ) ORDER BY s.created_at ASC
    ) AS shadow_history
    FROM public.manifests m
    JOIN public.manifests s ON s.related_tx_id = m.transaction_id AND s.is_debt_clearance = true
    WHERE m.payment_mode = 'Debt'
    GROUP BY m.transaction_id
  LOOP
    UPDATE public.manifests
    SET amount_paid = LEAST(amount, GREATEST(amount_paid, v_rec.shadow_total)),
        payment_history = CASE
          WHEN payment_history = '[]'::jsonb OR payment_history IS NULL THEN v_rec.shadow_history
          ELSE payment_history
        END
    WHERE transaction_id = v_rec.transaction_id;
  END LOOP;

  -- -------------------------------------------------------------
  -- 3. MARKETING ENTRIES: Backfill debt_amount_paid & payment_history from shadow rows
  -- -------------------------------------------------------------
  FOR v_rec IN
    SELECT mk.entry_ref, COALESCE(SUM(s.amount_paid), 0) AS shadow_total, jsonb_agg(
      jsonb_build_object(
        'amount', s.amount_paid,
        'mode', COALESCE(s.payment_mode, 'Cash'),
        'by', COALESCE(s.entered_by::text, 'system'),
        'at', s.created_at
      ) ORDER BY s.created_at ASC
    ) AS shadow_history
    FROM public.marketing_entries mk
    JOIN public.marketing_entries s ON s.related_tx_id = mk.entry_ref AND s.is_debt_clearance = true
    WHERE mk.payment_mode = 'Debt'
    GROUP BY mk.entry_ref
  LOOP
    UPDATE public.marketing_entries
    SET debt_amount_paid = LEAST(amount_paid, GREATEST(debt_amount_paid, v_rec.shadow_total)),
        payment_history = CASE
          WHEN payment_history = '[]'::jsonb OR payment_history IS NULL THEN v_rec.shadow_history
          ELSE payment_history
        END
    WHERE entry_ref = v_rec.entry_ref;
  END LOOP;

  -- -------------------------------------------------------------
  -- 4. PACKAGE ENTRIES: Fix legacy debt_paid boolean rows
  -- -------------------------------------------------------------
  UPDATE public.package_entries
  SET amount_paid = amount,
      payment_history = CASE
        WHEN payment_history = '[]'::jsonb OR payment_history IS NULL THEN jsonb_build_array(
          jsonb_build_object(
            'amount', amount,
            'mode', 'Cash',
            'by', COALESCE(entered_by::text, 'system'),
            'at', COALESCE(debt_paid_at, created_at)
          )
        )
        ELSE payment_history
      END
  WHERE payment_mode = 'Debt' AND debt_paid = true AND amount_paid < amount;

  -- -------------------------------------------------------------
  -- 5. CORPORATE CLIENTS: Recalculate accumulated_monthly_debt
  -- -------------------------------------------------------------
  FOR v_rec IN SELECT id FROM public.corporate_clients LOOP
    SELECT COALESCE(SUM(
      GREATEST(0, c.amount - COALESCE(c.amount_paid, 0) - COALESCE(c.retrieved_amount, 0))
    ), 0) INTO v_sum
    FROM (
      SELECT amount, amount_paid, retrieved_amount, corporate_client_id::text FROM public.cargo_entries WHERE receipt_mode = 'Debt'
      UNION ALL
      SELECT amount, amount_paid, retrieved_amount, corporate_client_id::text FROM public.manifests WHERE payment_mode = 'Debt'
      UNION ALL
      SELECT amount, amount_paid, retrieved_amount, corporate_client_id::text FROM public.package_entries WHERE payment_mode = 'Debt'
      UNION ALL
      SELECT amount_paid AS amount, debt_amount_paid AS amount_paid, retrieved_amount, corporate_client_id::text FROM public.marketing_entries WHERE payment_mode = 'Debt'
    ) c
    WHERE c.corporate_client_id = v_rec.id::text;

    UPDATE public.corporate_clients
    SET accumulated_monthly_debt = v_sum
    WHERE id = v_rec.id;
  END LOOP;

END $$;
