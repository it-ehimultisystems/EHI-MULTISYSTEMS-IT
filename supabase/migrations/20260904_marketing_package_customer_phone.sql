-- marketing_entries and package_entries have never had anywhere to store
-- the customer's phone number. Both intake forms (MarketingWorkspace.tsx,
-- PackageForm.tsx) capture it into local form state and use it for the
-- immediate same-session WhatsApp send / receipt print, but the Transaction
-- object handed to onAddTx never carried it, so it was never written to
-- either table -- any later reprint from TransactionLedger.tsx always shows
-- a blank phone, and there's no way to contact the customer again.
--
-- Named customer_phone (not consignee_phone) to keep it distinct from
-- cargo_entries.consignee_phone -- a marketing/package customer isn't
-- necessarily a shipment consignee.
ALTER TABLE public.marketing_entries
  ADD COLUMN IF NOT EXISTS customer_phone text;

ALTER TABLE public.package_entries
  ADD COLUMN IF NOT EXISTS customer_phone text;
