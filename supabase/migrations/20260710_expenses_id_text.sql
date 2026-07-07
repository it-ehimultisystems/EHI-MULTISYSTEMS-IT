-- expenses.id was uuid, but the app always sends its own client-generated
-- id (format EX-YYMMDD-XXXXXX) via uid('EX'). Every insert has therefore
-- been rejected by Postgres with "invalid input syntax for type uuid",
-- silently swallowed by writeWithOfflineSupport as if it were an offline
-- write. Switching id to text so the app's own id is the real primary key.
ALTER TABLE public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.expenses ALTER COLUMN id TYPE text USING id::text;
