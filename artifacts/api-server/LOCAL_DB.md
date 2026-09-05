# Local PostgreSQL Setup

The API server and `@workspace/db` package read PostgreSQL from `DATABASE_URL`.

Replit-internal database hostnames such as `helium` are only resolvable inside Replit's network. They will fail from local Windows with errors like:

```text
getaddrinfo ENOTFOUND helium
```

For local development, use a PostgreSQL URL that is reachable from your machine:

- Neon
- Supabase
- a local Docker PostgreSQL container
- another externally reachable PostgreSQL host

Do not commit a real `DATABASE_URL` or any Clerk secret. Use `artifacts/api-server/.env.example` as a placeholder template only.

Example format:

```env
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

Cloud Postgres providers commonly require `sslmode=require`. Local Docker PostgreSQL usually does not.

## Schema

Versioned migrations are stored in `lib/db/drizzle`. The initial migration is a
baseline for creating the current schema in a new, empty database. See
`lib/db/MIGRATIONS.md` before generating or applying migrations.

The existing `db:push:local` command remains available only as a legacy local
development convenience. Do not use `drizzle-kit push` or `push-force` to change
the production schema.

Tables used by the current API:

- `users`: required by `/api/auth/me`; new Clerk users are inserted with role `viewer`.
- `videos`: required by lecture catalog/detail/admin endpoints.
- `video_views`: reserved for viewing history.

To make a first admin after signing in once and creating a `users` row, run SQL in your database console:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Windows PowerShell Commands

Set environment variables for the current PowerShell session:

```powershell
$env:DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
$env:CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
$env:CLERK_SECRET_KEY="sk_test_your_secret_key_here"
$env:PORT="5000"
$env:NODE_ENV="development"
```

Build the API server:

```powershell
npx.cmd pnpm@latest --filter @workspace/api-server build
```

Push the Drizzle schema to the configured database:

```powershell
npx.cmd pnpm@latest --filter @workspace/db push
```

Start the API server:

```powershell
npx.cmd pnpm@latest --filter @workspace/api-server start
```

The web app can then call the API through its relative `/api` paths via the Vite proxy.

## Video Storage

Metadata-only lecture creation works with PostgreSQL and Clerk only. For local development, the API server can also store uploaded lecture videos on disk.

Set these variables when running the API server locally:

```powershell
$env:STORAGE_DRIVER="local"
$env:LOCAL_STORAGE_DIR="uploads"
```

With `STORAGE_DRIVER=local`, the admin upload flow uses:

```text
POST /api/storage/uploads/request-url
PUT /api/storage/uploads/local/:uploadId
GET /api/storage/objects/local/videos/:file
```

The API stores files under `artifacts/api-server/uploads/videos` by default because the API package runs with `artifacts/api-server` as its working directory. The database stores object paths like:

```text
local/videos/<uuid>.mp4
```

Supported local development upload types:

- MP4
- WebM
- MOV

The upload directory is ignored by git. To reset local uploaded video files:

```powershell
Remove-Item -Recurse -Force artifacts\api-server\uploads
```

Do not use this local filesystem driver as production storage. It is intended for single-machine development only.

The Replit/object storage path still uses the existing upload route:

```text
POST /api/storage/uploads/request-url
```

That production-style path depends on Replit object storage style environment/configuration:

- `PRIVATE_OBJECT_DIR`
- `PUBLIC_OBJECT_SEARCH_PATHS` for public object serving
- access to the Replit sidecar endpoint used by `artifacts/api-server/src/lib/objectStorage.ts`

If those are not available and `STORAGE_DRIVER` is not set to `local`, selecting a video file in the admin form will show a backend storage error instead of pretending upload succeeded. Leave the file input empty to create a metadata-only lecture record.
