-- AccountingConsole's Cash Register tab kept its own opening-balance /
-- physical-count / lock state in localStorage, disconnected from
-- eod_records (the table EODReconciliation.tsx already reads/writes for
-- the real EOD lock). eod_records has no columns for these yet, so add
-- them here rather than introduce a second naming convention.
ALTER TABLE public.eod_records
  ADD COLUMN IF NOT EXISTS opening_balance numeric(12,2),
  ADD COLUMN IF NOT EXISTS physical_count  numeric(12,2);
