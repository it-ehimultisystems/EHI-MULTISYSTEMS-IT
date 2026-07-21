# Migration Policy

## Filenames

Migration filenames must use the REAL date the migration was written, in the
format `YYYYMMDD_short_description.sql`. Never invent future dates. If two
migrations land on the same real day, suffix them `_a`, `_b` (e.g.
`20260905_foo_a.sql`, `20260905_foo_b.sql`) to keep a stable, unambiguous
apply order.

The existing future-dated files (`20260728` through `20260833`) keep their
names as-is — renaming files that are already shared across every developer's
local checkout and the live database would cause worse confusion than the
inaccurate dates themselves. This policy applies going forward, to every NEW
file: new files must sort AFTER `20260833` in plain filename order, so until
1 September 2026 (real calendar date), prefix new files `2026090x` even if
written earlier than that, and note the real authoring date in a header
comment at the top of the file instead.

## Every migration ends with a bookkeeping insert

Once `supabase/0000_schema_migrations_tracking.sql` has been applied, every
migration file written from that point on must end with:

```sql
INSERT INTO public.schema_migrations (filename) VALUES ('<its own filename>')
ON CONFLICT (filename) DO NOTHING;
```

This turns "is X applied to the live database?" into a `SELECT` instead of a
guess, and is what `supabase/VERIFY_LIVE_DB.sql`'s CHECK 8 reads from.

## Applying order

1. Run `supabase/0000_schema_migrations_tracking.sql` first (one-time setup).
2. Run `supabase/VERIFY_LIVE_DB.sql` to see current state.
3. Run any missing migrations, oldest filename first.
4. Re-run `supabase/VERIFY_LIVE_DB.sql` until every check passes.
