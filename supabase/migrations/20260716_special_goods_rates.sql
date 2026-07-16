-- Content types (Medical, Tyres, Documents, ...) were pure metadata with no
-- rate attached. Some of them ("special goods") need their own per-airline
-- pricing that varies by weight bracket instead of the flat route-based
-- rate everything else uses -- e.g. Tyres on Airline X: 0-45kg = rate A,
-- 46-100kg = rate B. is_special_goods flags which content types this
-- applies to; special_goods_rates holds the actual per-airline kg-tier
-- rows for flagged ones. See CargoForm.tsx's resolveRate() for how a
-- matching tier takes priority over the normal hub/company rate cascade.
ALTER TABLE public.content_types ADD COLUMN IF NOT EXISTS is_special_goods boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.special_goods_rates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_id  uuid NOT NULL REFERENCES public.content_types(id) ON DELETE CASCADE,
  airline          text NOT NULL,
  min_kg           numeric(10,2) NOT NULL CHECK (min_kg >= 0),
  max_kg           numeric(10,2) CHECK (max_kg IS NULL OR max_kg > min_kg),
  rate_per_kg      numeric(10,2) NOT NULL,
  updated_by       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type_id, airline, min_kg)
);

CREATE INDEX IF NOT EXISTS special_goods_rates_content_type_idx ON public.special_goods_rates(content_type_id);

REVOKE ALL ON TABLE public.special_goods_rates FROM anon;
ALTER TABLE public.special_goods_rates ENABLE ROW LEVEL SECURITY;
-- Not hub-scoped -- company-wide config, same access tier as
-- content_types/standard_cargo_rates (super_admin/admin/accountant write,
-- any authenticated read -- staff pricing an entry need to read these
-- without being able to change them).
DROP POLICY IF EXISTS "Authenticated read special_goods_rates" ON public.special_goods_rates;
DROP POLICY IF EXISTS "Admins insert special_goods_rates" ON public.special_goods_rates;
DROP POLICY IF EXISTS "Admins update special_goods_rates" ON public.special_goods_rates;
DROP POLICY IF EXISTS "Admins delete special_goods_rates" ON public.special_goods_rates;
CREATE POLICY "Authenticated read special_goods_rates" ON public.special_goods_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert special_goods_rates" ON public.special_goods_rates FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update special_goods_rates" ON public.special_goods_rates FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins delete special_goods_rates" ON public.special_goods_rates FOR DELETE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
