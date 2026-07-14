-- PaymentValidation.tsx's bank-alert-paste-and-parse confirm flow has always
-- set bankReference/bankSender/bankAlertText on the in-memory Transaction,
-- but handleUpdateTx (src/components/EHIApp.tsx) never had columns to write
-- them to -- they only ever lived in optimistic local React state and were
-- silently discarded on the next fetch/reload. Adding these lets a matched
-- bank alert's details actually survive a refetch instead of vanishing.
-- Transfer debts/payments can occur on any of these three tables, so all
-- three get the columns (package_entries debt is Cash/POS-collected per its
-- own migration's comment, not Transfer, so it's not included here).

ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS bank_reference text;
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS bank_sender text;
ALTER TABLE public.cargo_entries ADD COLUMN IF NOT EXISTS bank_alert_text text;

ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS bank_reference text;
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS bank_sender text;
ALTER TABLE public.manifests ADD COLUMN IF NOT EXISTS bank_alert_text text;

ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS bank_reference text;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS bank_sender text;
ALTER TABLE public.marketing_entries ADD COLUMN IF NOT EXISTS bank_alert_text text;
