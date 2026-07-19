CREATE TABLE IF NOT EXISTS public.hub_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES public.hubs(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  sales_summary jsonb,
  opened_by text,
  closed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.hub_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub-scoped read hub_shifts" ON public.hub_shifts;
CREATE POLICY "Hub-scoped read hub_shifts" ON public.hub_shifts FOR SELECT TO authenticated
  USING (hub_id = ANY(public.sibling_hub_ids()) OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped insert hub_shifts" ON public.hub_shifts;
CREATE POLICY "Hub-scoped insert hub_shifts" ON public.hub_shifts FOR INSERT TO authenticated
  WITH CHECK (hub_id = public.current_user_hub_id() OR hub_id IS NULL OR public.is_hub_unrestricted());

DROP POLICY IF EXISTS "Hub-scoped update hub_shifts" ON public.hub_shifts;
CREATE POLICY "Hub-scoped update hub_shifts" ON public.hub_shifts FOR UPDATE TO authenticated
  USING (hub_id = public.current_user_hub_id() OR hub_id IS NULL OR public.is_hub_unrestricted());
