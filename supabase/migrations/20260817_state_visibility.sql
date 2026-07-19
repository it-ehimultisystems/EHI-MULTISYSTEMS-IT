-- Create a function to get all sibling hub IDs (hubs in the same state)
CREATE OR REPLACE FUNCTION public.sibling_hub_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_agg(id)
  FROM public.hubs
  WHERE state = (
    SELECT state FROM public.hubs WHERE id = public.current_user_hub_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.sibling_hub_ids() TO authenticated;

-- Update RLS policies to use sibling_hub_ids() for read operations
-- so agents can see transactions from other hubs in their state.

DROP POLICY IF EXISTS "Hub-scoped read cargo_entries" ON public.cargo_entries;
CREATE POLICY "Hub-scoped read cargo_entries" ON public.cargo_entries FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped read manifests" ON public.manifests;
CREATE POLICY "Hub-scoped read manifests" ON public.manifests FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped read marketing_entries" ON public.marketing_entries;
CREATE POLICY "Hub-scoped read marketing_entries" ON public.marketing_entries FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped read package_entries" ON public.package_entries;
CREATE POLICY "Hub-scoped read package_entries" ON public.package_entries FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped read expenses" ON public.expenses;
CREATE POLICY "Hub-scoped read expenses" ON public.expenses FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());
