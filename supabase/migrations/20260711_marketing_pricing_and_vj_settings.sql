-- Two pieces of pricing config were 100% localStorage-only with zero
-- server sync: the VJ excess-baggage free-allowance/rate, and the
-- Marketing BB/MB/SB route pricing matrix (the latter was also being
-- edited from two separate screens -- PricingConfiguration.tsx and
-- Settings.tsx -- each writing the same localStorage key independently
-- with no shared source of truth). Neither ever crossed devices at all.

-- VJ settings piggyback on the existing pricing_config key/value store
-- (same pattern as airline_commissions) since it's just two numbers.
-- No schema change needed there -- just a new config_key row, written
-- by the app.

-- Marketing BB/MB/SB pricing is a real per-route table, not a flat
-- map, so it gets its own table (mirrors standard_cargo_rates' shape).
CREATE TABLE IF NOT EXISTS public.marketing_route_rates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name  text UNIQUE NOT NULL,
  bb_rate     numeric(10,2) NOT NULL DEFAULT 0,
  mb_rate     numeric(10,2) NOT NULL DEFAULT 0,
  sb_rate     numeric(10,2) NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_route_rates ENABLE ROW LEVEL SECURITY;
-- Not hub-scoped -- pricing is company-wide config, deliberately visible
-- and editable the same way from every hub, matching standard_cargo_rates
-- and pricing_config's existing (also non-hub-scoped) access pattern.
DROP POLICY IF EXISTS "Authenticated read marketing_route_rates"   ON public.marketing_route_rates;
DROP POLICY IF EXISTS "Authenticated upsert marketing_route_rates" ON public.marketing_route_rates;
DROP POLICY IF EXISTS "Authenticated update marketing_route_rates" ON public.marketing_route_rates;
CREATE POLICY "Authenticated read marketing_route_rates"   ON public.marketing_route_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated upsert marketing_route_rates" ON public.marketing_route_rates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update marketing_route_rates" ON public.marketing_route_rates FOR UPDATE TO authenticated USING (true);

-- Seed with the same defaults the app currently hardcodes client-side,
-- so switching over doesn't blank out existing configured-looking values.
INSERT INTO public.marketing_route_rates (route_name, bb_rate, mb_rate, sb_rate) VALUES
  ('LOS/Lagos - ABV/Abuja', 18000, 12000, 7500),
  ('LOS/Lagos - PHC/Port Harcourt', 22000, 15000, 9500),
  ('ABV/Abuja - LOS/Lagos', 18000, 12000, 7500),
  ('PHC/Port Harcourt - LOS/Lagos', 22000, 15000, 9500),
  ('LOS/Lagos - ENU/Enugu', 19500, 13000, 8000)
ON CONFLICT (route_name) DO NOTHING;
