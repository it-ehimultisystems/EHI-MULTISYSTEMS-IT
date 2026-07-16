-- Every rate table so far computes price as kg * rate_per_kg with no floor,
-- but the business also quotes a flat minimum charge per airline+route for
-- low weight brackets (e.g. Airline X, Lagos-Abuja, 1-13kg = a flat 8000
-- minimum, even though 13 * rate_per_kg might come out lower). This is
-- independent of content type -- it's a floor applied after the normal
-- per-kg rate (standard/hub/special-goods) resolves. See CargoForm.tsx's
-- resolveRate()/autoAmount for where the floor is applied.
CREATE TABLE IF NOT EXISTS public.minimum_charges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline          text NOT NULL,
  route_name       text NOT NULL,
  min_kg           numeric(10,2) NOT NULL CHECK (min_kg >= 0),
  max_kg           numeric(10,2) CHECK (max_kg IS NULL OR max_kg > min_kg),
  minimum_amount   numeric(12,2) NOT NULL,
  updated_by       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (airline, route_name, min_kg)
);

CREATE INDEX IF NOT EXISTS minimum_charges_airline_route_idx ON public.minimum_charges(airline, route_name);

REVOKE ALL ON TABLE public.minimum_charges FROM anon;
ALTER TABLE public.minimum_charges ENABLE ROW LEVEL SECURITY;
-- Not hub-scoped -- company-wide config, same access tier as
-- special_goods_rates/content_types (super_admin/admin/accountant write,
-- any authenticated read).
DROP POLICY IF EXISTS "Authenticated read minimum_charges" ON public.minimum_charges;
DROP POLICY IF EXISTS "Admins insert minimum_charges" ON public.minimum_charges;
DROP POLICY IF EXISTS "Admins update minimum_charges" ON public.minimum_charges;
DROP POLICY IF EXISTS "Admins delete minimum_charges" ON public.minimum_charges;
CREATE POLICY "Authenticated read minimum_charges" ON public.minimum_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert minimum_charges" ON public.minimum_charges FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update minimum_charges" ON public.minimum_charges FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins delete minimum_charges" ON public.minimum_charges FOR DELETE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
