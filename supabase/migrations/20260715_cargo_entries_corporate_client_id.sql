-- Corporate B2B gate-weighing transactions had no way to be reliably
-- attributed back to which corporate client they belonged to. The rate
-- calculation only ever matched by company_name (a mutable, editable
-- field) against the intake's freeform consignee text, and that match
-- was never persisted onto the finalized transaction at all -- meaning
-- there was no durable way to query "all transactions for Corporate
-- Client X" for billing summaries/reporting, and a client rename between
-- intake and finalize could silently break the rate lookup too.
--
-- The app now captures the corporate client's stable ID at intake time
-- and carries it through onto the finalized transaction. This column is
-- where that ID actually persists in Supabase.
ALTER TABLE public.cargo_entries
  ADD COLUMN IF NOT EXISTS corporate_client_id text;

CREATE INDEX IF NOT EXISTS idx_cargo_entries_corporate_client_id
  ON public.cargo_entries (corporate_client_id)
  WHERE corporate_client_id IS NOT NULL;
