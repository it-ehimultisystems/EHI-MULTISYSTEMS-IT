-- ════════════════════════════════════════════════════════════════
-- EHI LIVE DATABASE VERIFICATION SCRIPT
-- Generated 2026-07-21, verified against commit a87ec61 on origin/main.
-- Run each numbered block in the Supabase SQL editor and compare
-- against the EXPECTED result. Any mismatch = that migration is NOT
-- applied. Fix by running the named migration file, oldest first.
-- This script is READ-ONLY. It changes nothing.
-- ════════════════════════════════════════════════════════════════

-- ── CHECK 1: Dangerous open wallet policies (finding #24) ──
-- EXPECTED: zero rows. Any row here means customer wallets are
-- readable/writable by ANYONE with the public anon key.
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('customer_wallets', 'wallet_transactions')
  AND ('public' = ANY(roles) OR 'anon' = ANY(roles));

-- ── CHECK 2: Hub-scoped wallet policies exist (20260810) ──
-- EXPECTED: at least SELECT/INSERT/UPDATE policies named 'Hub-scoped %'
-- on both tables, granted TO authenticated.
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('customer_wallets', 'wallet_transactions')
ORDER BY tablename, policyname;

-- ── CHECK 3: RLS actually ENABLED on every money table ──
-- EXPECTED: relrowsecurity = true for every row returned.
SELECT c.relname, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('cargo_entries','manifests','marketing_entries',
    'package_entries','expenses','eod_records','customer_wallets',
    'wallet_transactions','corporate_clients','pricing_config',
    'hub_awb_counters','hub_shifts','driver_trips','trip_pings')
ORDER BY c.relname;

-- ── CHECK 4: Required functions exist ──
-- EXPECTED: one row per function name below.
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('next_awb_number','peek_awb_number','reserve_awb_block',
    'apply_wallet_transaction','process_cargo_retrieval',
    'get_my_role','get_my_hub_id')
ORDER BY proname;

-- ── CHECK 5: Every column the app SELECTs actually exists ──
-- (Column lists expanded verbatim from EHIApp.tsx's fetchInitial,
-- lines 329-332 as of commit a87ec61.)
-- EXPECTED: the count returned by each query below must EQUAL the
-- number of names in its IN (...) list. If it's lower, run:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name='<table>' — and diff to find the missing ones.
SELECT count(*) AS cargo_cols_found FROM information_schema.columns
WHERE table_schema='public' AND table_name='cargo_entries'
  AND column_name IN (
    'entry_ref','consignee_name','airline','awb_tag_number','total_pcs',
    'total_kg','route','content_type','amount','receipt_mode','pickup_pin',
    'status','created_at','commission_rate','bank','hub_id','terminal',
    'remark','amount_paid','payment_history','payment_confirmed',
    'pos_approval_code','confirmed_by','confirmed_at','consignee_phone',
    'client_type','corporate_client_id','bank_reference','bank_sender',
    'bank_alert_text','entered_by','last_edited_by','last_edited_at',
    'wallet_id','wallet_deduction_amount','retrieved','retrieved_amount',
    'retrieved_pieces','retrieved_kg','retrieval_note','retrieved_at',
    'retrieved_by'
  ); -- EXPECTED: 42

SELECT count(*) AS manifest_cols_found FROM information_schema.columns
WHERE table_schema='public' AND table_name='manifests'
  AND column_name IN (
    'transaction_id','passenger_name','flight_no','destination','excess_kg',
    'amount','payment_mode','created_at','bank','hub_id','total_kg','pnr',
    'passenger_phone','total_pcs','amount_paid','payment_history','airline',
    'payment_confirmed','pos_approval_code','confirmed_by','confirmed_at',
    'bank_reference','bank_sender','bank_alert_text','entered_by',
    'last_edited_by','last_edited_at','wallet_id','wallet_deduction_amount'
  ); -- EXPECTED: 29

SELECT count(*) AS marketing_cols_found FROM information_schema.columns
WHERE table_schema='public' AND table_name='marketing_entries'
  AND column_name IN (
    'entry_ref','awb_tag_number','customer_name','route','qty_big_bag',
    'qty_med_bag','qty_small_bag','bb_kg','mb_kg','sb_kg','amount_paid',
    'payment_mode','created_at','hub_id','bank','entered_by',
    'last_edited_by','last_edited_at','debt_amount_paid','payment_history',
    'payment_confirmed','pos_approval_code','confirmed_by','confirmed_at',
    'bank_reference','bank_sender','bank_alert_text','wallet_id',
    'wallet_deduction_amount'
  ); -- EXPECTED: 29

SELECT count(*) AS package_cols_found FROM information_schema.columns
WHERE table_schema='public' AND table_name='package_entries'
  AND column_name IN (
    'entry_ref','customer_name','destination','content_type','total_pcs',
    'total_kg','contents','status','amount','payment_mode','bank',
    'payment_narration','debt_paid','debt_paid_at','amount_paid',
    'payment_history','created_at','hub_id','terminal','payment_confirmed',
    'pos_approval_code','confirmed_by','confirmed_at','entered_by',
    'last_edited_by','last_edited_at','wallet_id','wallet_deduction_amount'
  ); -- EXPECTED: 28

-- ── CHECK 6: hub_shifts table + department column (newest feature) ──
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='hub_shifts'
ORDER BY ordinal_position;

-- ── CHECK 7: eod unique constraint the upserts rely on ──
-- EXPECTED: a UNIQUE constraint/index on (hub_id, date).
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'eod_records';

-- ── CHECK 8: migration bookkeeping table (create if missing) ──
-- If this errors with "relation does not exist", run
-- 0000_schema_migrations_tracking.sql first.
SELECT count(*) AS tracked_migrations FROM public.schema_migrations;
