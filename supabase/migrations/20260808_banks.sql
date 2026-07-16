-- Bank list was a hardcoded constants.ts export (10 banks), independently
-- drifted from BankReconciliation.tsx's own 5-bank BankFormat dropdown and
-- TransactionLedger.tsx's edit-modal 5-bank dropdown (different casing,
-- e.g. "Access Bank" vs "Access"). This gives it one canonical DB-backed
-- list; csv_format lets BankReconciliation.tsx's dropdown pick the right
-- statement-parser variant without a second hardcoded list -- the parser
-- logic itself (parseNigerianBankCSV) stays code, unaffected.
CREATE TABLE IF NOT EXISTS public.banks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  csv_format text, -- one of BankReconciliation.tsx's parser keys ('UBA'|'GTBank'|'Access'|'Zenith'|'FirstBank'), NULL if unsupported
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read banks" ON public.banks;
DROP POLICY IF EXISTS "Admins insert banks" ON public.banks;
DROP POLICY IF EXISTS "Admins update banks" ON public.banks;
DROP POLICY IF EXISTS "Admins delete banks" ON public.banks;
CREATE POLICY "Authenticated read banks" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert banks" ON public.banks FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update banks" ON public.banks FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins delete banks" ON public.banks FOR DELETE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));

INSERT INTO public.banks (name, csv_format) VALUES
  ('UBA', 'UBA'),
  ('GTBank', 'GTBank'),
  ('Access', 'Access'),
  ('Zenith', 'Zenith'),
  ('First Bank', 'FirstBank'),
  ('Polaris', NULL),
  ('Keystone', NULL),
  ('Fidelity', NULL),
  ('Sterling', NULL)
ON CONFLICT (name) DO NOTHING;
