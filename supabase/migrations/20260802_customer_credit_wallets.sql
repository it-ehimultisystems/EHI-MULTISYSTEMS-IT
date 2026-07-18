-- ============================================================
-- FILE: supabase/migrations/20260802_customer_credit_wallets.sql
-- ============================================================
-- Customer Credit Wallets & Wallet Transactions for prepaid customer credits
-- and retrieval deductions across all desks (Cargo, Baggage, Marketing, Packages).

CREATE TABLE IF NOT EXISTS public.customer_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES public.hubs(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_topped_up NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL,
  source_ref TEXT,
  source_note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.customer_wallets(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id),
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  cargo_ref TEXT,
  description TEXT,
  logged_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS & Policies
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to customer_wallets" ON public.customer_wallets;
CREATE POLICY "Allow full access to customer_wallets" ON public.customer_wallets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow full access to wallet_transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow public access if anon key is used
DROP POLICY IF EXISTS "Allow public access to customer_wallets" ON public.customer_wallets;
CREATE POLICY "Allow public access to customer_wallets" ON public.customer_wallets FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow public access to wallet_transactions" ON public.wallet_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- Add wallet reference & deduction columns to entry tables
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.customer_wallets(id);
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS wallet_deduction_amount NUMERIC(12,2);

ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.customer_wallets(id);
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS wallet_deduction_amount NUMERIC(12,2);

ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.customer_wallets(id);
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS wallet_deduction_amount NUMERIC(12,2);

ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.customer_wallets(id);
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS wallet_deduction_amount NUMERIC(12,2);

-- Update check constraints on payment / receipt mode to allow 'Wallet'
ALTER TABLE public.cargo_entries DROP CONSTRAINT IF EXISTS cargo_entries_receipt_mode_check;
ALTER TABLE public.cargo_entries ADD CONSTRAINT cargo_entries_receipt_mode_check CHECK (receipt_mode IN ('Cash', 'Transfer', 'TransferCash', 'POS', 'Debt', 'Wallet', 'Complementary'));

ALTER TABLE public.manifests DROP CONSTRAINT IF EXISTS manifests_payment_mode_check;
ALTER TABLE public.manifests ADD CONSTRAINT manifests_payment_mode_check CHECK (payment_mode IN ('Cash', 'Transfer', 'TransferCash', 'POS', 'Debt', 'Wallet', 'Complementary'));

ALTER TABLE public.marketing_entries DROP CONSTRAINT IF EXISTS marketing_entries_payment_mode_check;
ALTER TABLE public.marketing_entries ADD CONSTRAINT marketing_entries_payment_mode_check CHECK (payment_mode IN ('Cash', 'Transfer', 'TransferCash', 'POS', 'Debt', 'Wallet', 'Complementary'));

ALTER TABLE public.package_entries DROP CONSTRAINT IF EXISTS package_entries_payment_mode_check;
ALTER TABLE public.package_entries ADD CONSTRAINT package_entries_payment_mode_check CHECK (payment_mode IN ('Cash', 'Transfer', 'TransferCash', 'POS', 'Debt', 'Wallet', 'Complementary'));
