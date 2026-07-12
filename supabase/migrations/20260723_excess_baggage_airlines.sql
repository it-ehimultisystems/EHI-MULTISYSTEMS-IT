-- ValueJet's excess-baggage ticketing was a single hardcoded airline
-- (fixed VK flight prefix, fixed 23kg/₦1000 pricing, one 'vj_agent' role,
-- one 'VJ POS' tab). EHI is onboarding more airlines that bill excess
-- baggage the same way, so this generalizes the whole path: a real
-- registry table instead of a one-off config row, a plain `airline`
-- column on manifests so the table can hold every carrier's tickets
-- (mirrors how cargo_entries already holds Arik/Green Africa/United
-- Nigeria in one table via its own `airline` column), and a generic
-- `baggage_agent` role with a per-user assigned airline replacing the
-- single-purpose `vj_agent` role.

-- ── Excess-baggage airline registry ────────────────────────
CREATE TABLE IF NOT EXISTS public.excess_baggage_airlines (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text UNIQUE NOT NULL,
  flight_prefix      text NOT NULL,
  tag_code           text UNIQUE NOT NULL,
  free_allowance_kg  numeric(10,2) NOT NULL DEFAULT 0,
  rate_per_kg        numeric(10,2) NOT NULL DEFAULT 0,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.excess_baggage_airlines ENABLE ROW LEVEL SECURITY;
-- Not hub-scoped -- company-wide config, same access pattern as
-- pricing_config/standard_cargo_rates/marketing_route_rates.
DROP POLICY IF EXISTS "Authenticated read excess_baggage_airlines"   ON public.excess_baggage_airlines;
DROP POLICY IF EXISTS "Authenticated insert excess_baggage_airlines" ON public.excess_baggage_airlines;
DROP POLICY IF EXISTS "Authenticated update excess_baggage_airlines" ON public.excess_baggage_airlines;
CREATE POLICY "Authenticated read excess_baggage_airlines"   ON public.excess_baggage_airlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert excess_baggage_airlines" ON public.excess_baggage_airlines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update excess_baggage_airlines" ON public.excess_baggage_airlines FOR UPDATE TO authenticated USING (true);

-- Seed ValueJet as the first configured airline, carrying over its
-- existing free-allowance/rate from pricing_config.vj_settings so
-- switching over doesn't silently change anyone's live pricing.
INSERT INTO public.excess_baggage_airlines (name, flight_prefix, tag_code, free_allowance_kg, rate_per_kg)
SELECT
  'ValueJet',
  'VK',
  'VJ',
  COALESCE((SELECT (config_value->>'freeKg')::numeric FROM public.pricing_config WHERE config_key = 'vj_settings'), 23),
  COALESCE((SELECT (config_value->>'ratePerKg')::numeric FROM public.pricing_config WHERE config_key = 'vj_settings'), 1000)
ON CONFLICT (name) DO NOTHING;

-- ── manifests: support more than one carrier in the same table ─────
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS airline text NOT NULL DEFAULT 'ValueJet';

-- ── Generalize the vj_agent role into baggage_agent + assigned_airline ─
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS assigned_airline text;

UPDATE public.user_profiles SET assigned_airline = 'ValueJet' WHERE role = 'vj_agent';
UPDATE public.user_profiles SET role = 'baggage_agent' WHERE role = 'vj_agent';

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN (
  'super_admin','admin','cargo_agent','marketing_agent',
  'baggage_agent','scanner','driver','accountant','auditor','office_work'));
