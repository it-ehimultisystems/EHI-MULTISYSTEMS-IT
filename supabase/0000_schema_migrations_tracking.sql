-- One-time setup: migration bookkeeping so "what is applied?" becomes
-- a query instead of a guess. After running this once, every future
-- migration file must END with:
--   INSERT INTO public.schema_migrations (filename) VALUES ('<its own filename>')
--   ON CONFLICT (filename) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
-- Read-only visibility for the app; only the SQL editor (postgres role,
-- bypasses RLS) inserts rows.
DROP POLICY IF EXISTS "Authenticated read schema_migrations" ON public.schema_migrations;
CREATE POLICY "Authenticated read schema_migrations"
  ON public.schema_migrations FOR SELECT TO authenticated USING (true);
