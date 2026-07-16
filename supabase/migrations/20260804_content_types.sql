-- Cargo/package content categories (Medical, Documents, Tyres, ...) were a
-- hardcoded constant with no DB table and no admin UI -- adding a new
-- category required a code change and redeploy. This gives them the same
-- registry-table treatment excess_baggage_airlines already has.
CREATE TABLE IF NOT EXISTS public.content_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;
-- Not hub-scoped -- company-wide config, same access tier as
-- standard_cargo_rates/marketing_route_rates (super_admin/admin/accountant
-- write, any authenticated read).
DROP POLICY IF EXISTS "Authenticated read content_types" ON public.content_types;
DROP POLICY IF EXISTS "Admins insert content_types" ON public.content_types;
DROP POLICY IF EXISTS "Admins update content_types" ON public.content_types;
DROP POLICY IF EXISTS "Admins delete content_types" ON public.content_types;
CREATE POLICY "Authenticated read content_types" ON public.content_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert content_types" ON public.content_types FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins update content_types" ON public.content_types FOR UPDATE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));
CREATE POLICY "Admins delete content_types" ON public.content_types FOR DELETE TO authenticated USING (public.current_user_role() IN ('super_admin','admin','accountant'));

-- Seed from the hardcoded list this table replaces. 'Other' is not seeded --
-- it's a synthetic sentinel appended at read time, same convention as
-- hubRoutes.ts/airlines.ts (CargoForm.tsx already branches on
-- contentType === "Other" for a free-text override, so it must stay out of
-- the DB-backed list, not become a deletable/renamable row).
INSERT INTO public.content_types (name) VALUES
  ('Medical'),
  ('Clothes & Shoes'),
  ('Documents'),
  ('Chairs/Furniture'),
  ('Tyres'),
  ('Phones/Electronics'),
  ('Cosmetics'),
  ('Package/Parcel'),
  ('Baby Items'),
  ('SIM Cards'),
  ('Clearance'),
  ('Courier')
ON CONFLICT (name) DO NOTHING;
