-- Package/Parcel was built flat-fee with no piece count, weight, or
-- contents description at all -- every other stream (Cargo, Marketing,
-- ValueJet) captures these, but Package never did, so staff had nowhere to
-- log them and the public tracking page always showed "-" for Weight/
-- Pieces on a package entry. content_type stays exactly as-is (it's a
-- CHECK-constrained 'Package'/'Parcel' service class, not a contents
-- description) -- these are new, separate columns.
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS total_pcs integer NOT NULL DEFAULT 1;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS total_kg  numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.package_entries ADD COLUMN IF NOT EXISTS contents  text;

-- Extend the public-tracking anon grant from 20260718_package_tracking.sql
-- to include the new columns.
REVOKE ALL ON TABLE public.package_entries FROM anon;
GRANT SELECT (entry_ref, customer_name, destination, content_type, total_pcs, total_kg, contents, status)
  ON public.package_entries TO anon;
