-- Proof of Delivery was previously local-device-only (IndexedDB via Dexie),
-- so a signature captured on one phone was invisible to every other device
-- and lost entirely if that device's browser storage was ever cleared. This
-- gives it a real home in Supabase, synced the same offline-first way as
-- cargo_entries/manifests/etc: write locally first (instant, works offline),
-- then upsert to Supabase immediately or via the background sync_queue retry
-- if the network isn't available at that moment.
CREATE TABLE IF NOT EXISTS public.proof_of_delivery (
  id                    text PRIMARY KEY,
  awb_number            text NOT NULL,
  consignee_name        text NOT NULL,
  delivered_by          text NOT NULL,
  received_by_name      text NOT NULL,
  received_by_phone     text,
  received_by_id_type   text,
  received_by_id_number text,
  signature_data        text NOT NULL,
  photo_data            text,
  delivered_at          timestamptz NOT NULL,
  hub_name              text NOT NULL,
  notes                 text,
  gps_latitude          double precision,
  gps_longitude         double precision,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proof_of_delivery_awb_idx ON public.proof_of_delivery(awb_number);
CREATE INDEX IF NOT EXISTS proof_of_delivery_delivered_at_idx ON public.proof_of_delivery(delivered_at DESC);

ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read proof_of_delivery"   ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Authenticated insert proof_of_delivery" ON public.proof_of_delivery;
CREATE POLICY "Authenticated read proof_of_delivery"   ON public.proof_of_delivery FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert proof_of_delivery" ON public.proof_of_delivery FOR INSERT TO authenticated WITH CHECK (true);
