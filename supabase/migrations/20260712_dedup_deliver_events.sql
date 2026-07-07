-- A cargo_ref should never be marked DELIVER more than once — it's the
-- terminal state of the tracking lifecycle. This closes the race where two
-- staff release the same consignment (e.g. one via QR scan, one via the
-- Arrivals PIN-release screen) at nearly the same time and both writes pass
-- their app-level "already delivered?" check before either has committed.
--
-- ARRIVE/DEPART are intentionally left unconstrained here: cargo can
-- legitimately pass through the same hub more than once (transit loops,
-- returns), so a blanket unique index on those would reject valid scans.

-- Existing data can already contain duplicate DELIVER rows for the same
-- cargo_ref (this is the exact race the index below prevents going forward),
-- and the unique index creation fails outright if any duplicates remain.
-- Keep the earliest DELIVER per cargo_ref (the real delivery) and drop the
-- later duplicate(s) before adding the constraint. Safe to re-run — it's a
-- no-op once no duplicates remain.
DELETE FROM public.tracking_events t
USING (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY cargo_ref ORDER BY created_at ASC) AS rn
  FROM public.tracking_events
  WHERE event_type = 'DELIVER'
) dup
WHERE t.id = dup.id AND dup.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS tracking_events_one_deliver_per_cargo
  ON public.tracking_events (cargo_ref)
  WHERE event_type = 'DELIVER';
