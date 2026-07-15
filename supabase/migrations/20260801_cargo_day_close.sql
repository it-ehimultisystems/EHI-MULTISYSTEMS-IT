-- CARGO DESK DAY CLOSE -- a wholly separate close from
-- EODReconciliation.tsx's shared cargo+marketing+baggage+package
-- aggregate (eod_records/eod_locks). That screen is intentionally
-- left untouched; this is a new, Cargo-only close reachable from
-- CargoForm.tsx itself, mirroring package_day_close/marketing_day_close
-- in every column EXCEPT the boundary: cargo activity can span a
-- shift that starts one calendar day and ends the next (e.g. 10pm-6am),
-- so a bare `date` column can't represent what was actually closed.
-- period_start/period_end (both timestamptz) replace it.
--
-- Depends on public.current_user_hub_id()/is_hub_unrestricted() from
-- 20260708_hub_isolation_rls.sql -- must run after it, same as
-- package_day_close.

CREATE TABLE IF NOT EXISTS public.cargo_day_close (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id             uuid REFERENCES public.hubs(id),
  hub                text,
  period_start       timestamptz NOT NULL,
  period_end         timestamptz NOT NULL,
  total_sales        numeric(12,2) NOT NULL DEFAULT 0,
  cash_sales         numeric(12,2) NOT NULL DEFAULT 0,
  pos_sales          numeric(12,2) NOT NULL DEFAULT 0,
  transfer_sales     numeric(12,2) NOT NULL DEFAULT 0,
  debt_sales         numeric(12,2) NOT NULL DEFAULT 0,
  total_expenses     numeric(12,2) NOT NULL DEFAULT 0,
  balance_cash       numeric(12,2) NOT NULL DEFAULT 0,
  entry_count        integer NOT NULL DEFAULT 0,
  route_counts       jsonb NOT NULL DEFAULT '{}',
  closed_by          text,
  closed_at          timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end > period_start),
  -- Two closes for the same hub ending at the literal same instant are a
  -- duplicate submission by definition -- period_end is the boundary that
  -- "nothing after this point is included in this close," so it can't be
  -- claimed twice. UNIQUE(hub_id, date) (package/marketing's approach)
  -- would be wrong here on purpose: two legitimate closes on the same
  -- calendar day (an early-shift close at 14:00, then the evening shift
  -- closing at 23:00) must both be allowed -- that flexibility is the
  -- entire point of this table existing instead of reusing package_day_close's
  -- shape. UNIQUE(hub_id, period_start) was considered and rejected: two
  -- closes could legitimately share a start (e.g. a corrected re-close
  -- attempt with a different end), but never a shared end.
  UNIQUE (hub_id, period_end)
);

-- Used by CargoForm.tsx to default a new close's period_start to the
-- previous close's period_end for this hub (continuous, non-overlapping
-- periods without staff having to remember/type the last boundary).
CREATE INDEX IF NOT EXISTS cargo_day_close_hub_period_idx
  ON public.cargo_day_close(hub_id, period_end DESC);

ALTER TABLE public.cargo_day_close ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub-scoped read cargo_day_close" ON public.cargo_day_close;
CREATE POLICY "Hub-scoped read cargo_day_close" ON public.cargo_day_close FOR SELECT TO authenticated
  USING (hub_id = public.current_user_hub_id() OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped upsert cargo_day_close" ON public.cargo_day_close;
CREATE POLICY "Hub-scoped upsert cargo_day_close" ON public.cargo_day_close FOR INSERT TO authenticated
  WITH CHECK (hub_id = public.current_user_hub_id() OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped update cargo_day_close" ON public.cargo_day_close;
CREATE POLICY "Hub-scoped update cargo_day_close" ON public.cargo_day_close FOR UPDATE TO authenticated
  USING (hub_id = public.current_user_hub_id() OR hub_id IS NULL OR public.is_hub_unrestricted());
