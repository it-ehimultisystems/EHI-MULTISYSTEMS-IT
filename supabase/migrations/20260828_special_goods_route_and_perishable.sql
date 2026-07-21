-- ============================================================
-- SPECIAL GOODS: add a route dimension, seed Lagos perishable rates
-- ============================================================

-- route_name: NULL = applies to every route (the existing behaviour); a value
-- = an override for that one route. Same NULL-is-default idea hub_id already
-- uses (20260820_special_goods_hub_scoping.sql).
ALTER TABLE public.special_goods_rates
  ADD COLUMN IF NOT EXISTS route_name text;

-- Widen the uniqueness to include the route AND keep hub_id in the key.
-- 20260820_special_goods_hub_scoping.sql's live constraint is
-- special_goods_rates_content_type_id_airline_hub_min_kg_key (content_type_id,
-- airline, hub_id, min_kg) -- NOT the original pre-hub-scoping
-- special_goods_rates_content_type_id_airline_min_kg_key, which that
-- migration already dropped. Both are dropped here (IF EXISTS, so whichever
-- is actually live goes, the other is a no-op) so this is the one surviving
-- uniqueness rule.
--
-- hub_id is coalesced to text alongside route_name, not left as a plain
-- column: a plain UNIQUE(...,hub_id,...) lets multiple NULL-hub rows coexist
-- without colliding (Postgres never treats NULL = NULL), which is exactly
-- why 20260820's constraint never caught accidental duplicate company-wide
-- defaults for the same content+airline+bracket. Dropping hub_id from the
-- key entirely (as a naive route-only index would) is worse: it would make
-- two DIFFERENT real hubs' otherwise-identical route overrides collide with
-- each other and fail to insert, breaking the multi-hub override this table
-- exists for. Coalescing both hub_id and route_name to '' keeps every
-- dimension in the key (so different hubs/routes never spuriously collide)
-- while also making repeated NULL defaults for the same tier correctly
-- collide (the same rationale this migration already applies to route_name).
ALTER TABLE public.special_goods_rates
  DROP CONSTRAINT IF EXISTS special_goods_rates_content_type_id_airline_min_kg_key;
ALTER TABLE public.special_goods_rates
  DROP CONSTRAINT IF EXISTS special_goods_rates_content_type_id_airline_hub_min_kg_key;
DROP INDEX IF EXISTS special_goods_rates_uniq;
CREATE UNIQUE INDEX special_goods_rates_uniq
  ON public.special_goods_rates (content_type_id, airline, coalesce(hub_id::text, ''), coalesce(route_name, ''), min_kg);

-- Perishable content types (idempotent). Mark them special-goods if your
-- content_types table has such a flag column; otherwise the SpecialGoodsRates
-- screen's "flag as special goods" toggle handles it.
INSERT INTO public.content_types (name) VALUES
  ('Perishable (Frozen/Fruit)'),
  ('Perishable (Wine)')
ON CONFLICT (name) DO NOTHING;

-- Seed Lagos (MMA2) perishable rates. route_name built from hubs.code so it
-- matches the app's `${code}/${name}`. Unmapped codes (BUC, BAYELSA, ANAMBRA)
-- are skipped by the JOIN.
DO $$
DECLARE v_hub uuid; v_frozen uuid; v_wine uuid;
BEGIN
  SELECT id INTO v_hub    FROM public.hubs WHERE code = 'LOS' LIMIT 1;
  SELECT id INTO v_frozen FROM public.content_types WHERE name = 'Perishable (Frozen/Fruit)' LIMIT 1;
  SELECT id INTO v_wine   FROM public.content_types WHERE name = 'Perishable (Wine)' LIMIT 1;
  IF v_hub IS NULL THEN
    RAISE NOTICE 'No hub with code LOS — perishable seed skipped.';
    RETURN;
  END IF;

  -- FROZEN / FRUIT (confident values)
  INSERT INTO public.special_goods_rates (content_type_id, airline, hub_id, route_name, min_kg, max_kg, rate_per_kg, updated_by)
  SELECT v_frozen, v.airline, v_hub, h.code || '/' || h.name, 1, NULL, v.rate, 'seed:perishable'
  FROM (VALUES
    -- AERO / ARIK / GREEN AFRICA
    ('Aero Contractors','ABV',600),('Aero Contractors','PHC',600),('Aero Contractors','BNI',600),
    ('Aero Contractors','CBQ',650),('Aero Contractors','ABB',650),('Aero Contractors','KAN',750),
    ('Arik Air','ABV',600),('Arik Air','PHC',600),('Arik Air','BNI',600),
    ('Arik Air','CBQ',650),('Arik Air','ABB',650),('Arik Air','KAN',750),
    ('Green Africa Airways','ABV',600),('Green Africa Airways','PHC',600),('Green Africa Airways','BNI',600),
    ('Green Africa Airways','CBQ',650),('Green Africa Airways','ABB',650),('Green Africa Airways','KAN',750),
    -- UNITED
    ('United Nigeria Airlines','ABV',650),('United Nigeria Airlines','PHC',650),
    ('United Nigeria Airlines','ABB',750),('United Nigeria Airlines','ENU',750),
    ('United Nigeria Airlines','KAN',800),('United Nigeria Airlines','KAD',800),  -- VERIFY: paper groups these at 800
    ('United Nigeria Airlines','SKO',750)                                          -- VERIFY: paper lists SKO perishable 750
  ) AS v(airline, code, rate)
  JOIN public.hubs h ON h.code = v.code
  ON CONFLICT (content_type_id, airline, coalesce(hub_id::text, ''), coalesce(route_name, ''), min_kg) DO NOTHING;

  -- WINE — handwritten "1w" override read as ₦1,000/kg. VERIFY before relying on it.
  INSERT INTO public.special_goods_rates (content_type_id, airline, hub_id, route_name, min_kg, max_kg, rate_per_kg, updated_by)
  SELECT v_wine, v.airline, v_hub, h.code || '/' || h.name, 1, NULL, v.rate, 'seed:perishable'
  FROM (VALUES
    ('Aero Contractors','ABV',1000),('Aero Contractors','PHC',1000),('Aero Contractors','BNI',1000),  -- VERIFY
    ('Aero Contractors','CBQ',1000),('Aero Contractors','ABB',1000),                                    -- VERIFY
    ('Arik Air','ABV',1000),('Arik Air','PHC',1000),('Arik Air','BNI',1000),                            -- VERIFY
    ('Arik Air','CBQ',1000),('Arik Air','ABB',1000),                                                    -- VERIFY
    ('Green Africa Airways','ABV',1000),('Green Africa Airways','PHC',1000),('Green Africa Airways','BNI',1000), -- VERIFY
    ('Green Africa Airways','CBQ',1000),('Green Africa Airways','ABB',1000),                             -- VERIFY
    ('United Nigeria Airlines','ABV',1000),('United Nigeria Airlines','PHC',1000),                       -- VERIFY
    ('United Nigeria Airlines','ABB',1000),('United Nigeria Airlines','ENU',1000)                        -- VERIFY
  ) AS v(airline, code, rate)
  JOIN public.hubs h ON h.code = v.code
  ON CONFLICT (content_type_id, airline, coalesce(hub_id::text, ''), coalesce(route_name, ''), min_kg) DO NOTHING;

  RAISE NOTICE 'Perishable rates seeded for hub %.', v_hub;
END $$;
