ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS bank text;
