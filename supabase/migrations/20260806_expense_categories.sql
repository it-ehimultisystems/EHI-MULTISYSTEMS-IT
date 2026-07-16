-- Expense categories were a hardcoded constants.ts list, independently
-- drifted from ExpensesTab.tsx's own hardcoded defaultBudgets keys (7 items
-- vs 6, different names -- "Card/Cardboard"+"Marker" vs "Cars"). Budgets
-- themselves were localStorage-only, keyed per month per device, so a
-- budget set on one terminal was invisible everywhere else despite the
-- month-scoped key implying they were meant to vary over time. This
-- replaces both with one canonical category list plus real per-month
-- budget rows.
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  month       text NOT NULL, -- 'YYYY-MM'
  budget      numeric(12,2) NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, month)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins insert expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins update expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins delete expense_categories" ON public.expense_categories;
CREATE POLICY "Authenticated read expense_categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert expense_categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update expense_categories" ON public.expense_categories FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins delete expense_categories" ON public.expense_categories FOR DELETE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));

DROP POLICY IF EXISTS "Authenticated read expense_budgets" ON public.expense_budgets;
DROP POLICY IF EXISTS "Admins insert expense_budgets" ON public.expense_budgets;
DROP POLICY IF EXISTS "Admins update expense_budgets" ON public.expense_budgets;
CREATE POLICY "Authenticated read expense_budgets" ON public.expense_budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert expense_budgets" ON public.expense_budgets FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update expense_budgets" ON public.expense_budgets FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));

-- Canonical list decided as constants.ts's version (Card/Cardboard, Marker
-- kept; "Cars" from ExpensesTab.tsx's separately-drifted list dropped).
INSERT INTO public.expense_categories (name) VALUES
  ('Card/Cardboard'),
  ('Carrier'),
  ('Transport'),
  ('Bus Hire'),
  ('Sack & Nylon'),
  ('Marker'),
  ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;
