-- A cargo_ref should never be marked DELIVER more than once — it's the
-- terminal state of the tracking lifecycle. This closes the race where two
-- staff release the same consignment (e.g. one via QR scan, one via the
-- Arrivals PIN-release screen) at nearly the same time and both writes pass
-- their app-level "already delivered?" check before either has committed.
--
-- ARRIVE/DEPART are intentionally left unconstrained here: cargo can
-- legitimately pass through the same hub more than once (transit loops,
-- returns), so a blanket unique index on those would reject valid scans.
CREATE UNIQUE INDEX IF NOT EXISTS tracking_events_one_deliver_per_cargo
  ON public.tracking_events (cargo_ref)
  WHERE event_type = 'DELIVER';
