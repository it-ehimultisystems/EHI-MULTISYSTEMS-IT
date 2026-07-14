-- handleUpdateTx (src/components/EHIApp.tsx) resolves a Transaction's target
-- table generically and writes payment_confirmed/pos_approval_code/
-- confirmed_by/confirmed_at unconditionally, regardless of which table it
-- resolved to. 20260719_package_payment_columns.sql gave package_entries
-- these columns, but cargo_entries, manifests (baggage), and
-- marketing_entries never got them (cargo_entries got confirmed_by/
-- confirmed_at only, from 20260706_full_schema.sql -- it was still missing
-- payment_confirmed/pos_approval_code). That meant confirming a Cash/
-- Transfer payment for a Cargo, Baggage, or Marketing transaction either
-- failed against Supabase's schema cache or was silently dropped. This
-- brings all three tables to the same column parity as package_entries.
-- ADD COLUMN IF NOT EXISTS is used throughout (including for cargo_entries'
-- confirmed_by/confirmed_at) so this is safe to run regardless of exactly
-- which of these columns already exist on a given table.

ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS pos_approval_code text;
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS pos_approval_code text;
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS pos_approval_code text;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
