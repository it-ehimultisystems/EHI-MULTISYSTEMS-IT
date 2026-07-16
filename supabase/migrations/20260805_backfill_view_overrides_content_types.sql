-- More:ContentTypes is a new More-menu screen (src/lib/permissions.ts
-- STATIC_VIEWS). getAllowedTabs() treats a non-null view_overrides as the
-- exact, non-additive list of what a user can see, so anyone with a
-- customized view list set before this screen existed would never see it
-- even though their role (super_admin/admin/accountant) grants it by
-- default -- same backfill pattern as 20260731_backfill_view_overrides_more_menu.sql.

UPDATE public.user_profiles
SET view_overrides = (
  SELECT ARRAY(SELECT DISTINCT unnest(view_overrides || ARRAY['More:ContentTypes']))
)
WHERE view_overrides IS NOT NULL
  AND role IN ('super_admin', 'admin', 'accountant');
