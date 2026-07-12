-- Marketing entries only ever recorded bag *counts* (qty_big_bag/qty_med_bag/
-- qty_small_bag), never weight -- but airlines bill/fly cargo by kg, not bag
-- count, so there was no way to reconcile a marketing entry against what the
-- airline actually charged. Add a kg figure per bag category, same numeric
-- shape as cargo_entries.total_kg.
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS bb_kg numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS mb_kg numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS sb_kg numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS total_kg numeric(10,2) GENERATED ALWAYS AS (bb_kg + mb_kg + sb_kg) STORED;
