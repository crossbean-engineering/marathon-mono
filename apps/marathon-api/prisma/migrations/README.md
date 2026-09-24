# Migrations

No migrations have been generated yet — this requires a live PostgreSQL
instance and is deferred to whoever first runs:

```bash
npx nx prisma-migrate-dev marathon-api --name init
```

## Required: enable `uuid-ossp` before the first migration

Every model in this schema uses `@default(dbgenerated("uuid_generate_v1()"))`
for its primary key, which is provided by PostgreSQL's `uuid-ossp` extension.
That extension is **not** enabled by default, so the very first migration must
create it before any `CREATE TABLE` statements run.

When the initial migration is generated, prepend this statement to the top of
its `migration.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Then re-run the migration against a fresh database to confirm it applies
cleanly end-to-end.

**Do not edit a migration after it has been applied/committed anywhere** — add
a new migration instead. This note only applies to the *first* migration,
before it exists.
