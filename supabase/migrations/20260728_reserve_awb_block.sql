-- next_awb_number() (20260710_hub_awb_counters.sql) is a hard, synchronous
-- network dependency that gates cargo/marketing/package/excess-baggage
-- submission: if the RPC call fails (e.g. no connectivity), the form
-- clears its tag field and blocks submission outright, even though the
-- rest of the save pipeline (src/lib/sync.ts's Dexie-backed offline queue)
-- already handles offline writes fine. A client-random tag was already
-- deliberately rejected elsewhere in this codebase (see next_awb_number's
-- own comment) because it can collide under concurrent submissions at a
-- busy hub, and entry_ref IS the literal tag number for cargo_entries/
-- package_entries (PRIMARY KEY / UNIQUE), with the physical tag printed
-- and stuck onto the cargo piece immediately -- no renumber-later scheme
-- is possible once that's happened.
--
-- reserve_awb_block lets the client pre-reserve a whole block of real,
-- atomically-allocated numbers while online, cache them locally (see
-- src/lib/tagPool.ts), and hand them out instantly offline or online --
-- same atomicity/uniqueness guarantee as next_awb_number (same table,
-- same upsert-and-increment pattern), just advancing the counter by
-- p_count in one statement instead of 1, so the whole returned range is
-- guaranteed never handed to any other caller.
CREATE OR REPLACE FUNCTION public.reserve_awb_block(p_hub_code TEXT, p_count INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last INTEGER;
BEGIN
  INSERT INTO public.hub_awb_counters (hub_code, last_number)
  VALUES (p_hub_code, 1000 + p_count)
  ON CONFLICT (hub_code) DO UPDATE
    SET last_number = hub_awb_counters.last_number + p_count
  RETURNING last_number INTO v_last;

  -- Block start is the first number in the newly-reserved range --
  -- v_last is now the LAST number in the range after advancing by p_count.
  RETURN v_last - p_count + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_awb_block(TEXT, INTEGER) TO authenticated;

-- Defense in depth: marketing_entries.awb_tag_number was only indexed, not
-- DB-unique-constrained (20260721_marketing_awb_tag_number.sql), unlike
-- cargo_entries.awb_tag_number. The block-reservation scheme above makes
-- collisions structurally impossible regardless, but this closes the gap
-- for consistency (existing data already comes from the same atomic
-- counter, so no pre-existing duplicates are expected -- NULLs are fine,
-- Postgres UNIQUE never treats multiple NULLs as a conflict).
-- DROP + re-ADD makes this safe to re-run, matching this file's convention
-- (e.g. user_profiles_role_check above).
ALTER TABLE public.marketing_entries DROP CONSTRAINT IF EXISTS marketing_entries_awb_tag_number_key;
ALTER TABLE public.marketing_entries ADD CONSTRAINT marketing_entries_awb_tag_number_key UNIQUE (awb_tag_number);
