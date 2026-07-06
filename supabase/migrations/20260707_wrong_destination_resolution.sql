-- Wrong-destination alerts need a resolution trail (who cleared it, when) and
-- the hub the cargo was last legitimately seen at, so the alert view can show
-- "came from X, wrongly scanned at Y, belongs at Z" instead of destination only.
ALTER TABLE public.tracking_events
  ADD COLUMN IF NOT EXISTS previous_hub text,
  ADD COLUMN IF NOT EXISTS resolved      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_by   text,
  ADD COLUMN IF NOT EXISTS resolved_at   timestamptz;

CREATE INDEX IF NOT EXISTS idx_tracking_events_wrong_destination_unresolved
  ON public.tracking_events (created_at DESC)
  WHERE event_type = 'WRONG_DESTINATION_ALERT' AND resolved = false;
