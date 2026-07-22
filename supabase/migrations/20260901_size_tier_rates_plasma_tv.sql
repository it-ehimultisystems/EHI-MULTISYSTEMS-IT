-- Written 2026-07-22 (see docs/MIGRATION_POLICY.md -- filenames must sort
-- after the existing 20260833 file, so this is prefixed 2026090x rather
-- than its real authoring date).
--
-- Mirrors 20260829_flat_tier_rates_bumper_burnet.sql exactly, but keyed on
-- screen size in INCHES instead of weight in kg -- e.g. a "Plasma TV"
-- content type priced by screen-size bracket rather than kg bracket.
-- Kept as a fully separate table/flag rather than reusing flat_tier_rates'
-- min_kg/max_kg columns for a different unit, which would mislabel the
-- schema and the admin UI for anyone configuring or reading it later.

ALTER TABLE public.content_types
  ADD COLUMN IF NOT EXISTS is_size_tier boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.size_tier_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id          uuid NOT NULL REFERENCES public.hubs(id),
  content_type_id uuid NOT NULL REFERENCES public.content_types(id) ON DELETE CASCADE,
  airline         text NOT NULL,
  route_name      text NOT NULL,
  min_inches      numeric(10,2) NOT NULL CHECK (min_inches >= 0),
  max_inches      numeric(10,2) CHECK (max_inches IS NULL OR max_inches > min_inches),
  flat_amount     numeric(12,2) NOT NULL,
  updated_by      text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hub_id, content_type_id, airline, route_name, min_inches)
);
CREATE INDEX IF NOT EXISTS size_tier_rates_lookup_idx
  ON public.size_tier_rates (content_type_id, airline, route_name);

ALTER TABLE public.size_tier_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read size_tier_rates" ON public.size_tier_rates;
CREATE POLICY "Read size_tier_rates" ON public.size_tier_rates FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Write size_tier_rates" ON public.size_tier_rates;
CREATE POLICY "Write size_tier_rates" ON public.size_tier_rates FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'admin')
    OR (public.current_user_role() = 'accountant' AND hub_id = public.current_user_hub_id())
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    OR (public.current_user_role() = 'accountant' AND hub_id = public.current_user_hub_id())
  );

-- What was actually billed, for audit/reprint -- kg alone can't reconstruct
-- which screen-size bracket a size-tier sale was priced from (kg is a
-- different, unrelated physical quantity still tracked for manifest/cargo
-- weight purposes on the same entry).
ALTER TABLE public.cargo_entries
  ADD COLUMN IF NOT EXISTS size_inches numeric(10,2);

INSERT INTO public.schema_migrations (filename) VALUES ('20260901_size_tier_rates_plasma_tv.sql')
ON CONFLICT (filename) DO NOTHING;
