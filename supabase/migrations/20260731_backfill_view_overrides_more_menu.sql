-- The Custom View Access checklist (StaffManagement.tsx) previously only
-- covered top-level nav tabs. This session folded ~22 More-menu screens
-- (Bank Reconciliation, Pricing Configuration, Staff Management, Corporate
-- Client Billing, etc.) into the same permission system, gated in More.tsx
-- via canAccessTab instead of hardcoded per-screen role checks.
--
-- getAllowedTabs() treats a non-null view_overrides as the *exact*,
-- non-additive list of what a user can see -- it does not fall back to
-- role defaults for ids missing from that list. Any staff member who
-- already had a custom view_overrides set BEFORE this change has an array
-- that predates every one of these new ids, since they didn't exist yet
-- when it was seeded/edited. Left alone, the next time More.tsx renders
-- for that person it would silently lock them out of every single
-- More-menu screen their role would otherwise grant -- e.g. an accountant
-- with a customized view list losing Bank Reconciliation, Central
-- Accounting ERP, Pricing Configuration, Corporate Billing, etc. all at
-- once, with no error and no obvious cause.
--
-- This is a one-time backfill: for every user with a non-null
-- view_overrides, union in exactly the new ids their role would already
-- get from getRoleDefaultTabs() today (mirrors src/lib/permissions.ts's
-- STATIC_VIEWS role lists exactly). Anything a super_admin deliberately
-- unchecked among the *pre-existing* ids is left untouched -- this only
-- adds the ids that couldn't have been either checked or unchecked yet
-- because they didn't exist.

CREATE OR REPLACE FUNCTION public._more_menu_defaults_for_role(p_role text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY(
    SELECT t.id FROM (VALUES
      ('More:EODClose',              ARRAY['super_admin','admin','accountant','auditor','cargo_agent','baggage_agent','marketing_agent','driver','office_work']),
      ('More:TransactionLedger',     ARRAY['super_admin','admin','accountant','auditor','cargo_agent','baggage_agent','marketing_agent','driver','office_work']),
      ('More:SupportTickets',        ARRAY['super_admin','admin','accountant','auditor','cargo_agent','baggage_agent','marketing_agent','driver','office_work']),
      ('More:BankReconciliation',    ARRAY['super_admin','accountant']),
      ('More:AccountingConsole',     ARRAY['super_admin','admin','accountant']),
      ('More:Reports',               ARRAY['super_admin','admin','accountant']),
      ('More:AirlineCommissions',    ARRAY['super_admin','admin','accountant']),
      ('More:CorporateBilling',      ARRAY['super_admin','admin','accountant']),
      ('More:Forecasting',           ARRAY['super_admin','admin']),
      ('More:FraudAlerts',           ARRAY['super_admin','admin','auditor','accountant']),
      ('More:AuditLog',              ARRAY['super_admin','auditor']),
      ('More:Fleet',                 ARRAY['super_admin','admin']),
      ('More:PODLog',                ARRAY['super_admin','admin','auditor','accountant']),
      ('More:Dispatch',              ARRAY['super_admin','admin']),
      ('AirlineLedger',              ARRAY['super_admin','admin','accountant']),
      ('WeightManifest',             ARRAY['super_admin','admin','cargo_agent','office_work']),
      ('DataImport',                 ARRAY['super_admin','admin']),
      ('AirlineLogos',               ARRAY['super_admin','admin']),
      ('More:PricingConfiguration',  ARRAY['super_admin','admin','accountant']),
      ('More:HubCargoRates',         ARRAY['super_admin','admin','accountant']),
      ('More:ExcessBaggageAirlines', ARRAY['super_admin','admin','accountant']),
      ('More:Settings',              ARRAY['super_admin']),
      ('More:StaffManagement',       ARRAY['super_admin','admin'])
    ) AS t(id, roles)
    WHERE p_role = ANY(t.roles)
  );
$$;

UPDATE public.user_profiles
SET view_overrides = (
  SELECT ARRAY(SELECT DISTINCT unnest(view_overrides || public._more_menu_defaults_for_role(role)))
)
WHERE view_overrides IS NOT NULL;

DROP FUNCTION public._more_menu_defaults_for_role(text);
