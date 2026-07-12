-- Marketing entries generate a sequential tag/AWB number (EHI-{HUB}-MK-{seq})
-- that gets printed on the physical bag tag and encoded in its QR code --
-- but marketing_entries never had a column to persist it, so the only
-- reference actually stored (entry_ref) is a different, internally-generated
-- random id the customer never sees. A customer scanning their tag's QR
-- code, or typing the AWB printed on it, into the public /track page always
-- got "No shipment found" because that value was never in the database at
-- all under any column.
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS awb_tag_number text;
CREATE INDEX IF NOT EXISTS idx_marketing_entries_awb_tag_number ON public.marketing_entries (awb_tag_number);

-- Extend the public-tracking anon grant from 20260716_security_hardening.sql
-- to include the new column, so /track can search and display it the same
-- way it already does for cargo_entries.awb_tag_number.
REVOKE ALL ON TABLE public.marketing_entries FROM anon;
GRANT SELECT (entry_ref, awb_tag_number, customer_name, route, status)
  ON public.marketing_entries TO anon;
