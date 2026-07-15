-- The hubs table has only ever had a SELECT RLS policy (20260706_full_schema.sql)
-- -- no INSERT, no UPDATE. That means Settings.tsx's existing hub
-- active/inactive toggle (handleToggleHub, calling .update() on this table)
-- has likely been silently failing at the database layer since it shipped,
-- since its result was never checked. It also means the new "Add Hub" form
-- (Settings.tsx) cannot work without an INSERT policy. Both are fixed here,
-- with the same predicate used for admin-gated tables elsewhere
-- (hub_route_rates, hub_airline_route_rates): super_admin/admin only --
-- unlike those two rate tables, hub creation/editing has no accountant
-- carve-out, since hubs are company-wide infrastructure, not a hub-scoped
-- pricing override.
DROP POLICY IF EXISTS "Admins insert hubs" ON public.hubs;
CREATE POLICY "Admins insert hubs" ON public.hubs FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Admins update hubs" ON public.hubs;
CREATE POLICY "Admins update hubs" ON public.hubs FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
