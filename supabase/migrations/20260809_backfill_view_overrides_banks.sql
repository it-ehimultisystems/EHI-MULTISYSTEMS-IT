-- More:Banks is a new More-menu screen (src/lib/permissions.ts
-- STATIC_VIEWS) -- same backfill need as 20260805_backfill_view_overrides_content_types.sql.

UPDATE public.user_profiles
SET view_overrides = (
  SELECT ARRAY(SELECT DISTINCT unnest(view_overrides || ARRAY['More:Banks']))
)
WHERE view_overrides IS NOT NULL
  AND role IN ('super_admin', 'admin', 'accountant');
