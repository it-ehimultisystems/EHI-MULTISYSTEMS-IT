-- =============================================================
-- is_debt_clearance / related_tx_id: extend to manifests, marketing_entries,
-- package_entries (cargo_entries-only until now)
-- (Real authoring date: 2026-07-24. Filename prefixed 2026090x per
-- docs/MIGRATION_POLICY.md so it sorts after every migration already
-- applied to the live database.)
-- =============================================================
-- Found during a historical review of the last 60 commits: commit 02e2835
-- fixed debt-clearance shadow ("DC-...") rows corrupting route/awb/flight
-- parsing AND losing their COLLECTION badge -- but only cargo_entries ever
-- got the is_debt_clearance/related_tx_id columns these fixes depend on
-- (20260717_cargo_workflow_overhaul.sql). For baggage/marketing/package, a
-- debt clearance shows its COLLECTION badge and link back to the original
-- debt only optimistically (in-memory, right after DebtorsTab.tsx/
-- TransactionLedger.tsx creates the shadow entry) -- the moment the page
-- reloads or EHIApp.tsx's fetchInitial refetches, both columns come back
-- undefined for those three departments and the shadow row becomes visually
-- indistinguishable from a brand-new sale to the same customer. This
-- mirrors cargo_entries' own column definitions exactly.
-- =============================================================

ALTER TABLE public.manifests
  ADD COLUMN IF NOT EXISTS is_debt_clearance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_tx_id      text;

ALTER TABLE public.marketing_entries
  ADD COLUMN IF NOT EXISTS is_debt_clearance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_tx_id      text;

ALTER TABLE public.package_entries
  ADD COLUMN IF NOT EXISTS is_debt_clearance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_tx_id      text;

CREATE INDEX IF NOT EXISTS manifests_debt_clearance_idx
  ON public.manifests(hub_id, is_debt_clearance, created_at) WHERE is_debt_clearance = true;
CREATE INDEX IF NOT EXISTS marketing_entries_debt_clearance_idx
  ON public.marketing_entries(hub_id, is_debt_clearance, created_at) WHERE is_debt_clearance = true;
CREATE INDEX IF NOT EXISTS package_entries_debt_clearance_idx
  ON public.package_entries(hub_id, is_debt_clearance, created_at) WHERE is_debt_clearance = true;

INSERT INTO public.schema_migrations (filename) VALUES ('20260909_debt_clearance_columns_all_departments.sql')
ON CONFLICT (filename) DO NOTHING;
