-- New "Outbound Arrivals" view (src/components/views/OutboundArrivals.tsx)
-- lets a sending hub see which of its dispatched cargo_entries,
-- marketing_entries, and package_entries rows have status = 'Arrived' at
-- their destination, filtered by hub_id = the origin hub. None of the
-- three tables has an index that serves hub_id + status + recency together:
-- cargo_entries only has (hub_id, created_at) and a lone (status) index;
-- marketing_entries and package_entries only have (hub_id, created_at) with
-- no status index at all (marketing_entries.status predates this feature,
-- package_entries.status was added later in 20260718_package_tracking.sql
-- with no accompanying index). Add a composite index per table so this
-- query doesn't fall back to scanning every row for the hub.

CREATE INDEX IF NOT EXISTS idx_cargo_entries_hub_status_created ON public.cargo_entries(hub_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_entries_hub_status_created ON public.marketing_entries(hub_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_entries_hub_status_created ON public.package_entries(hub_id, status, created_at DESC);
