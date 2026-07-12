-- handleUpdateTx (src/components/EHIApp.tsx) resolves a Transaction's
-- target table generically and writes amount_paid/payment_history/
-- payment_confirmed/pos_approval_code/confirmed_by/confirmed_at
-- unconditionally, regardless of which table it resolved to. package_entries
-- was missing every one of these columns (it only ever had the simpler
-- debt_paid/debt_paid_at boolean from 20260709_package_desk.sql), which is
-- why editing a package transaction, recording a debt payment against it in
-- DebtorsTab, or confirming a package Transfer payment in PaymentValidation
-- all silently failed to persist once the 'package' type-routing bug in
-- handleUpdateTx was fixed to actually target this table. Mirrors
-- 20260710_debt_payment_columns.sql's treatment of cargo_entries/manifests
-- (amount_paid/payment_history) plus cargo_entries' confirmed_by/confirmed_at
-- (20260706_full_schema.sql) so package_entries reaches full column parity.

ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS payment_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS pos_approval_code text;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
