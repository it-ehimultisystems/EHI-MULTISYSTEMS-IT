-- Non-destructive "preview" of the next AWB/tag number for a given
-- per-hub counter key. Unlike next_awb_number(), this does NOT increment
-- the counter -- it only reads the current last_number and reports what
-- the next call to next_awb_number() would return right now. This lets
-- the UI show a real, accurate-looking tag to the agent before they
-- submit, without burning a real sequence number just because a form was
-- opened and then abandoned or reset. The actual number is only consumed
-- by next_awb_number() at submit time, so whichever agent actually
-- submits first gets it; a later submitter transparently gets the next
-- one after that -- no gaps from mere page loads, only from entries that
-- were genuinely never completed after already calling next_awb_number().
CREATE OR REPLACE FUNCTION public.peek_next_awb_number(p_hub_code TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT last_number FROM public.hub_awb_counters WHERE hub_code = p_hub_code),
    1000
  ) + 1;
$$;

GRANT EXECUTE ON FUNCTION public.peek_next_awb_number(TEXT) TO authenticated;
