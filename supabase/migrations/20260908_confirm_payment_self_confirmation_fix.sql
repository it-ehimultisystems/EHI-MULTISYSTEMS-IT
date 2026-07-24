-- =============================================================
-- confirm_payment_*: fix the self-confirmation guard, which is dead code
-- (Real authoring date: 2026-07-24. Filename prefixed 2026090x per
-- docs/MIGRATION_POLICY.md so it sorts after every migration already
-- applied to the live database.)
-- =============================================================
-- Found during a historical review of the last 60 commits. The guard added
-- in 20260902_multi_department_retrieval_and_wallet_cashout.sql (kept as-is
-- by 20260903_security_and_bugfix_pass.sql's redefine of cargo/baggage/
-- marketing) is:
--   IF p_confirmed AND v_entered_by IS NOT NULL AND v_entered_by = p_logged_by ...
-- v_entered_by comes from the entry's own entered_by column, which
-- EHIApp.tsx always populates with the creating user's UUID (user.id).
-- p_logged_by, however, is passed by every real caller (TransactionLedger.
-- tsx's toggleConfirm/savePosCode/selectAllCash, PaymentValidation.tsx) as
-- user.name -- a display name. A UUID can never equal a display name, so
-- this comparison is always false: the check can never fire, in any of the
-- four confirm_payment_* functions (cargo/baggage/marketing/package all
-- share the identical bug). The exact same class of bug -- a spoofable/
-- mismatched text comparison standing in for real identity -- was
-- correctly fixed elsewhere in the SAME migration (20260902) for the
-- wallet cash-payout maker-checker, using auth.uid() instead; this fix
-- applies that same pattern here. Same signatures as currently live --
-- safe CREATE OR REPLACE, no DROP needed.
-- =============================================================

CREATE OR REPLACE FUNCTION public.confirm_payment_cargo(
  p_entry_ref         text,
  p_confirmed         boolean,
  p_pos_approval_code text DEFAULT NULL,
  p_logged_by         text DEFAULT NULL,
  p_bank_reference    text DEFAULT NULL,
  p_bank_sender       text DEFAULT NULL,
  p_bank_alert_text   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hub_id     uuid;
  v_entered_by text;
BEGIN
  SELECT hub_id, entered_by INTO v_hub_id, v_entered_by FROM public.cargo_entries WHERE entry_ref = p_entry_ref FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo entry % not found', p_entry_ref;
  END IF;
  IF v_hub_id IS NOT NULL AND v_hub_id <> ALL(public.sibling_hub_ids()) AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to confirm payment for this entry''s hub';
  END IF;
  -- Real-identity check (auth.uid()), not the spoofable/always-false
  -- name-vs-uuid compare this used to be -- see header comment.
  IF p_confirmed AND v_entered_by IS NOT NULL AND v_entered_by = auth.uid()::text AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'You cannot confirm a payment you personally logged';
  END IF;

  UPDATE public.cargo_entries SET
    payment_confirmed = p_confirmed,
    confirmed_by      = CASE WHEN p_confirmed THEN COALESCE(p_logged_by, confirmed_by) ELSE NULL END,
    confirmed_at       = CASE WHEN p_confirmed THEN now() ELSE NULL END,
    pos_approval_code  = COALESCE(p_pos_approval_code, pos_approval_code),
    bank_reference     = COALESCE(p_bank_reference, bank_reference),
    bank_sender        = COALESCE(p_bank_sender, bank_sender),
    bank_alert_text    = COALESCE(p_bank_alert_text, bank_alert_text)
  WHERE entry_ref = p_entry_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_cargo(text, boolean, text, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_payment_baggage(
  p_transaction_id    text,
  p_confirmed         boolean,
  p_pos_approval_code text DEFAULT NULL,
  p_logged_by         text DEFAULT NULL,
  p_bank_reference    text DEFAULT NULL,
  p_bank_sender       text DEFAULT NULL,
  p_bank_alert_text   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hub_id     uuid;
  v_entered_by text;
BEGIN
  SELECT hub_id, entered_by INTO v_hub_id, v_entered_by FROM public.manifests WHERE transaction_id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baggage manifest % not found', p_transaction_id;
  END IF;
  IF v_hub_id IS NOT NULL AND v_hub_id <> ALL(public.sibling_hub_ids()) AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to confirm payment for this entry''s hub';
  END IF;
  IF p_confirmed AND v_entered_by IS NOT NULL AND v_entered_by = auth.uid()::text AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'You cannot confirm a payment you personally logged';
  END IF;

  UPDATE public.manifests SET
    payment_confirmed = p_confirmed,
    confirmed_by      = CASE WHEN p_confirmed THEN COALESCE(p_logged_by, confirmed_by) ELSE NULL END,
    confirmed_at       = CASE WHEN p_confirmed THEN now() ELSE NULL END,
    pos_approval_code  = COALESCE(p_pos_approval_code, pos_approval_code),
    bank_reference     = COALESCE(p_bank_reference, bank_reference),
    bank_sender        = COALESCE(p_bank_sender, bank_sender),
    bank_alert_text    = COALESCE(p_bank_alert_text, bank_alert_text)
  WHERE transaction_id = p_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_baggage(text, boolean, text, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_payment_marketing(
  p_entry_ref         text,
  p_confirmed         boolean,
  p_pos_approval_code text DEFAULT NULL,
  p_logged_by         text DEFAULT NULL,
  p_bank_reference    text DEFAULT NULL,
  p_bank_sender       text DEFAULT NULL,
  p_bank_alert_text   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hub_id     uuid;
  v_entered_by text;
BEGIN
  SELECT hub_id, entered_by INTO v_hub_id, v_entered_by FROM public.marketing_entries WHERE entry_ref = p_entry_ref FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marketing entry % not found', p_entry_ref;
  END IF;
  IF v_hub_id IS NOT NULL AND v_hub_id <> ALL(public.sibling_hub_ids()) AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to confirm payment for this entry''s hub';
  END IF;
  IF p_confirmed AND v_entered_by IS NOT NULL AND v_entered_by = auth.uid()::text AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'You cannot confirm a payment you personally logged';
  END IF;

  UPDATE public.marketing_entries SET
    payment_confirmed = p_confirmed,
    confirmed_by      = CASE WHEN p_confirmed THEN COALESCE(p_logged_by, confirmed_by) ELSE NULL END,
    confirmed_at       = CASE WHEN p_confirmed THEN now() ELSE NULL END,
    pos_approval_code  = COALESCE(p_pos_approval_code, pos_approval_code),
    bank_reference     = COALESCE(p_bank_reference, bank_reference),
    bank_sender        = COALESCE(p_bank_sender, bank_sender),
    bank_alert_text    = COALESCE(p_bank_alert_text, bank_alert_text)
  WHERE entry_ref = p_entry_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_marketing(text, boolean, text, text, text, text, text) TO authenticated;

-- package_entries has no bank_reference/bank_sender/bank_alert_text
-- columns (20260902's own note) -- same 4-param signature as currently live.
CREATE OR REPLACE FUNCTION public.confirm_payment_package(
  p_entry_ref         text,
  p_confirmed         boolean,
  p_pos_approval_code text DEFAULT NULL,
  p_logged_by         text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hub_id     uuid;
  v_entered_by text;
BEGIN
  SELECT hub_id, entered_by INTO v_hub_id, v_entered_by FROM public.package_entries WHERE entry_ref = p_entry_ref FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package entry % not found', p_entry_ref;
  END IF;
  IF v_hub_id IS NOT NULL AND v_hub_id <> ALL(public.sibling_hub_ids()) AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'Not authorized to confirm payment for this entry''s hub';
  END IF;
  IF p_confirmed AND v_entered_by IS NOT NULL AND v_entered_by = auth.uid()::text AND NOT public.is_hub_unrestricted() THEN
    RAISE EXCEPTION 'You cannot confirm a payment you personally logged';
  END IF;

  UPDATE public.package_entries SET
    payment_confirmed = p_confirmed,
    confirmed_by      = CASE WHEN p_confirmed THEN COALESCE(p_logged_by, confirmed_by) ELSE NULL END,
    confirmed_at       = CASE WHEN p_confirmed THEN now() ELSE NULL END,
    pos_approval_code  = COALESCE(p_pos_approval_code, pos_approval_code)
  WHERE entry_ref = p_entry_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_package(text, boolean, text, text) TO authenticated;

INSERT INTO public.schema_migrations (filename) VALUES ('20260908_confirm_payment_self_confirmation_fix.sql')
ON CONFLICT (filename) DO NOTHING;
