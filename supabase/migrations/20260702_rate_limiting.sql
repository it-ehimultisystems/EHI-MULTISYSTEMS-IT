-- Distributed rate limiting for serverless API routes.
--
-- WHY THIS EXISTS: the previous rate limiter (server/app.ts) used an
-- in-memory Map keyed by IP. On Vercel, each concurrent serverless
-- invocation can get its own process with its own empty Map, so a
-- client spreading requests across concurrent invocations effectively
-- resets the counter every time -- the limiter was not actually
-- enforcing a global cap. This table + function make the counter
-- shared and atomic across every invocation via a single INSERT ...
-- ON CONFLICT DO UPDATE, which Postgres guarantees is race-free even
-- when two concurrent calls try to create the same brand-new key at
-- once.
--
-- Cost tradeoff: each check is now a network round trip to Supabase
-- (EU West, ~120ms from Lagos). Only apply this to low-frequency,
-- deliberate actions (admin routes, notification/AI sends) -- not to
-- hot-path UI interactions.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0,
  reset_at  TIMESTAMPTZ NOT NULL
);

-- RLS enabled with NO policies defined below -- this is intentional, not
-- an oversight. It means the table is reachable only via the service-role
-- key (which bypasses RLS), matching how server/app.ts calls it. No
-- anon/authenticated client should ever query this table directly.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key       TEXT,
  p_max       INTEGER,
  p_window_ms INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now   TIMESTAMPTZ := clock_timestamp();
  v_count INTEGER;
BEGIN
  -- Single atomic upsert — Postgres guarantees INSERT ... ON CONFLICT is
  -- race-free even when two concurrent calls try to create the same brand
  -- new key at once (unlike a separate SELECT FOR UPDATE + INSERT, which
  -- has a window where both calls can miss the row and both attempt INSERT).
  INSERT INTO public.rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_ms || ' milliseconds')::interval)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                   WHEN rl.reset_at <= v_now THEN 1
                   ELSE rl.count + 1
                 END,
        reset_at = CASE
                     WHEN rl.reset_at <= v_now THEN v_now + (p_window_ms || ' milliseconds')::interval
                     ELSE rl.reset_at
                   END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Periodic cleanup so this table doesn't grow unbounded. Safe to run
-- from a cron/scheduled job, or just call occasionally -- deleting
-- expired rows is not time-sensitive.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE reset_at < clock_timestamp() - interval '1 hour';
$$;
