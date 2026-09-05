# PostgreSQL migrations

Drizzle schema files live in `lib/db/src/schema`. Versioned SQL migrations and
their metadata live in `lib/db/drizzle`.

## Commands

Run these commands from the repository root:

```bash
# Generate a migration from schema changes. This does not connect to a database.
pnpm db:generate -- --name describe_the_change

# Check the migration journal and generated migration files without applying them.
pnpm db:migrations:check

# Apply pending migrations to the database selected by DATABASE_URL.
pnpm db:migrate

# Open Drizzle Studio for the database selected by DATABASE_URL, when explicitly needed.
pnpm db:studio
```

`db:migrate` and `db:studio` require an explicitly selected `DATABASE_URL` and
must never be pointed at production casually. Review the target, backup state,
and pending SQL before either command is used.

The existing `db:push:local` command is retained as a legacy development
convenience. It must not be used for future production schema changes.
`drizzle-kit push` and `push-force` are prohibited for production.

## Baseline migration

The first checked-in migration is a baseline generated from the current Drizzle
schema. It creates only `users`, `videos`, and `video_views`, with the columns,
defaults, primary keys, and unique constraints currently declared in source.
It contains no application data or seed records.

The baseline is intended for a new, empty database. Do not run it directly on
an existing production database where these tables already exist: its `CREATE`
statements would conflict with existing objects.

Before an existing database can adopt this migration history, a separate,
explicit baselining procedure is required:

1. Compare the real database schema with the checked-in baseline in read-only
   mode.
2. Create and verify a database backup.
3. Register the baseline as already applied, or use another reviewed and agreed
   safe baselining method without recreating existing tables.

That procedure has not been performed for any existing database. It must be
planned and approved separately.

All future schema changes must be represented by new migration files generated
from reviewed schema changes. Never edit an already-applied migration to express
a new change.

Migrations are not run automatically when the backend starts. Adding automatic
startup migrations requires a separate design and deployment decision.
