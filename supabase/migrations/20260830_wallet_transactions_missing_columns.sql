-- wallet_transactions was declared with cargo_ref/cargo_entry_id columns
-- from the start (20260717_cargo_workflow_overhaul.sql's CREATE TABLE IF
-- NOT EXISTS), but a live top-up failed with "column cargo_entry_id of
-- relation wallet_transactions does not exist" -- the same class of bug
-- documented at length in 20260715_cargo_entries_corporate_client_id.sql:
-- CREATE TABLE IF NOT EXISTS is a no-op against a table that already
-- existed (e.g. created ad hoc via the Supabase dashboard before this
-- migration file was ever written), silently leaving out any column the
-- pre-existing table didn't already have. apply_wallet_transaction()
-- (20260810_wallet_atomicity_and_isolation.sql) unconditionally inserts
-- cargo_ref/cargo_entry_id/hub_id/description on every call -- including a
-- plain top-up, where cargo_entry_id is NULL but the column still has to
-- exist for the INSERT statement itself to succeed.
--
-- All four are nullable with no default requirement, so adding them to a
-- table that may already have rows is safe -- existing rows just get NULL.
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS hub_id uuid REFERENCES public.hubs(id);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS cargo_ref text;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS cargo_entry_id uuid;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS description text;
