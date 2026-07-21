-- ============================================================
-- FLAT WEIGHT-TIER PRICING (Bumper & Burnet)
-- ============================================================

-- Flag which content types price by flat weight bracket instead of per-kg.
ALTER TABLE public.content_types
  ADD COLUMN IF NOT EXISTS is_flat_tier boolean NOT NULL DEFAULT false;

-- One flat amount per (hub, content type, airline, route, weight bracket).
CREATE TABLE IF NOT EXISTS public.flat_tier_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id          uuid NOT NULL REFERENCES public.hubs(id),
  content_type_id uuid NOT NULL REFERENCES public.content_types(id) ON DELETE CASCADE,
  airline         text NOT NULL,
  route_name      text NOT NULL,
  min_kg          numeric(10,2) NOT NULL CHECK (min_kg >= 0),
  max_kg          numeric(10,2) CHECK (max_kg IS NULL OR max_kg > min_kg),
  flat_amount     numeric(12,2) NOT NULL,
  updated_by      text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hub_id, content_type_id, airline, route_name, min_kg)
);
CREATE INDEX IF NOT EXISTS flat_tier_rates_lookup_idx
  ON public.flat_tier_rates (content_type_id, airline, route_name);

-- RLS mirrors hub_airline_route_rates: broad read; write is super_admin/admin
-- (any hub) or accountant (own hub only).
REVOKE ALL ON TABLE public.flat_tier_rates FROM anon;
ALTER TABLE public.flat_tier_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read flat_tier_rates" ON public.flat_tier_rates;
DROP POLICY IF EXISTS "Hub rate editors insert flat_tier_rates" ON public.flat_tier_rates;
DROP POLICY IF EXISTS "Hub rate editors update flat_tier_rates" ON public.flat_tier_rates;
DROP POLICY IF EXISTS "Hub rate editors delete flat_tier_rates" ON public.flat_tier_rates;
CREATE POLICY "Authenticated read flat_tier_rates" ON public.flat_tier_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Hub rate editors insert flat_tier_rates" ON public.flat_tier_rates FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('super_admin','admin')
    OR (public.current_user_role() = 'accountant' AND hub_id = public.current_user_hub_id()));
CREATE POLICY "Hub rate editors update flat_tier_rates" ON public.flat_tier_rates FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('super_admin','admin')
    OR (public.current_user_role() = 'accountant' AND hub_id = public.current_user_hub_id()));
CREATE POLICY "Hub rate editors delete flat_tier_rates" ON public.flat_tier_rates FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('super_admin','admin')
    OR (public.current_user_role() = 'accountant' AND hub_id = public.current_user_hub_id()));

-- Content type for the product (flat-tier flagged).
INSERT INTO public.content_types (name, is_flat_tier) VALUES ('Bumper & Burnet', true)
ON CONFLICT (name) DO UPDATE SET is_flat_tier = true;

-- Seed both cards. Cross-join airlines × routes × brackets so each group is a
-- compact block; JOIN hubs on code so route_name matches the app and unmapped
-- codes (BAYELSA, JOS) skip. flat_amount is the whole price for that bracket.
DO $$
DECLARE v_hub uuid; v_ct uuid;
BEGIN
  SELECT id INTO v_hub FROM public.hubs WHERE code = 'LOS' LIMIT 1;
  SELECT id INTO v_ct  FROM public.content_types WHERE name = 'Bumper & Burnet' LIMIT 1;
  IF v_hub IS NULL THEN RAISE NOTICE 'No hub LOS — Bumper & Burnet seed skipped.'; RETURN; END IF;

  -- ── AERO / ARIK / GREEN card ──
  -- Group A: ABV, PHC, BNI, WARRI(QRW)
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, a.airline, h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('Aero Contractors'),('Arik Air'),('Green Africa Airways')) a(airline)
  CROSS JOIN (VALUES ('ABV'),('PHC'),('BNI'),('QRW')) g(code)
  CROSS JOIN (VALUES (1,12,12000),(13,20,14000),(21,26,16000),(27,31,18500),(32,39,22500),(40,47,27000),(48,55,30000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;
  -- Group B: ABB
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, a.airline, h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('Aero Contractors'),('Arik Air'),('Green Africa Airways')) a(airline)
  CROSS JOIN (VALUES ('ABB')) g(code)
  CROSS JOIN (VALUES (1,12,13000),(13,20,15000),(21,26,17000),(27,31,20000),(32,39,24000),(40,47,28000),(48,55,32000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;
  -- Group C: KAN, KAD (BAYELSA skipped — no hub)
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, a.airline, h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('Aero Contractors'),('Arik Air'),('Green Africa Airways')) a(airline)
  CROSS JOIN (VALUES ('KAN'),('KAD')) g(code)
  CROSS JOIN (VALUES (1,12,14000),(13,20,16000),(21,26,20000),(27,31,23000),(32,39,28000),(40,48,33000),(49,55,37000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;

  -- ── UNITED card ──
  -- Group A: ABV, PHC, BNI, WARRI(QRW)
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, 'United Nigeria Airlines', h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('ABV'),('PHC'),('BNI'),('QRW')) g(code)
  CROSS JOIN (VALUES (1,20,18000),(21,26,19500),(27,31,24000),(32,39,26000),(40,47,30000),(48,55,34000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;
  -- Group B: ENU, QOW, ABB (JOS skipped)
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, 'United Nigeria Airlines', h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('ENU'),('QOW'),('ABB')) g(code)
  CROSS JOIN (VALUES (1,20,18000),(21,26,22000),(27,31,24000),(32,39,27000),(40,47,32000),(48,55,37000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;
  -- Group C: KAN, KAD (BAYELSA skipped). Card starts at 13kg.
  -- VERIFY: (40,48) and (48,55) overlap at exactly 48kg (both brackets would
  -- match a 48kg parcel -- whichever row the fetch happens to return first
  -- wins, non-deterministically). Every other group on both cards uses a
  -- clean 47/48 (or 39/40, 48/49) boundary with no overlap; this looks like a
  -- transcription slip on this one bracket. Inserted exactly as given --
  -- confirm the correct boundary (47/48, like the other groups, or 48/49)
  -- against the physical card and adjust before relying on 48kg pricing here.
  INSERT INTO public.flat_tier_rates (hub_id, content_type_id, airline, route_name, min_kg, max_kg, flat_amount, updated_by)
  SELECT v_hub, v_ct, 'United Nigeria Airlines', h.code||'/'||h.name, b.lo, b.hi, b.amt, 'seed:bumper'
  FROM (VALUES ('KAN'),('KAD')) g(code)
  CROSS JOIN (VALUES (13,19,18000),(20,26,22000),(27,31,26000),(32,39,29000),(40,48,35000),(48,55,40000)) b(lo,hi,amt)
  JOIN public.hubs h ON h.code = g.code
  ON CONFLICT (hub_id, content_type_id, airline, route_name, min_kg) DO NOTHING;

  RAISE NOTICE 'Bumper & Burnet flat tiers seeded for hub %.', v_hub;
END $$;
