-- Per-hub atomic AWB sequence generator. Previous AWB generation had no
-- hub identity embedded and no server-side uniqueness guarantee (a
-- client-random 6-digit number, only checked for collision after the
-- fact). This gives every hub its own independent, gap-free, race-safe
-- counter, starting at 1001 (so the first AWB reads 001001 once
-- formatted) -- existing entries' already-generated AWB numbers are
-- untouched; this only governs new entries going forward.
CREATE TABLE IF NOT EXISTS public.hub_awb_counters (
  hub_code TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 1000
);

ALTER TABLE public.hub_awb_counters ENABLE ROW LEVEL SECURITY;
-- RLS enabled with no policies is intentional -- accessed only via
-- the function below, never queried directly by client code.

CREATE OR REPLACE FUNCTION public.next_awb_number(p_hub_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO public.hub_awb_counters (hub_code, last_number)
  VALUES (p_hub_code, 1001)
  ON CONFLICT (hub_code) DO UPDATE
    SET last_number = hub_awb_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_awb_number(TEXT) TO authenticated;
