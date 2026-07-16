-- excess_baggage_airlines (20260723_excess_baggage_airlines.sql) enabled RLS
-- and added SELECT/INSERT/UPDATE policies but no DELETE policy, yet
-- ExcessBaggageAirlines.tsx's "Remove airline" button calls .delete() on
-- this table -- with RLS enabled and no matching policy, Postgres denies by
-- default, so that button has likely been silently failing since it shipped.
-- Matches the broad "any authenticated user" access tier the other three
-- policies on this table already use (not the stricter admin-only tier used
-- by hubs/hub_route_rates), since this table has never distinguished roles.
DROP POLICY IF EXISTS "Authenticated delete excess_baggage_airlines" ON public.excess_baggage_airlines;
CREATE POLICY "Authenticated delete excess_baggage_airlines" ON public.excess_baggage_airlines FOR DELETE TO authenticated USING (true);
