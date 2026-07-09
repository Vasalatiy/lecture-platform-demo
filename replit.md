# Lecture Platform

A private educational video platform where admins upload lectures and viewers browse/watch them — mobile-first (Expo web + native), with email/password auth, role-based access, and GCS video storage.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo app (port 18115)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Local Windows database note: Replit-internal `DATABASE_URL` hosts such as `helium` are not resolvable outside Replit. Use an externally reachable PostgreSQL URL (for example Neon/Supabase) or local Docker PostgreSQL, then run `pnpm --filter @workspace/db run push`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- Mobile: Expo SDK 54, expo-router v6, React Native Web
- Auth: Clerk (@clerk/expo@3.4.3, @clerk/react@6.10.0)
- DB: PostgreSQL + Drizzle ORM
- Storage: GCS object storage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/api-server/src/` — Express API (routes/, middlewares/, app.ts)
- `artifacts/mobile/app/` — Expo Router screens
  - `(auth)/` — sign-in, sign-up screens
  - `(home)/(tabs)/` — catalog (index), admin dashboard
  - `(home)/lecture/[id]` — video player
  - `(home)/admin/` — upload, edit/[id]
- `lib/db/` — Drizzle schema (users, videos tables)
- `lib/api-spec/` — OpenAPI spec → codegen → React Query hooks
- `artifacts/mobile/contexts/AuthContext.tsx` — admin role management
- `patches/` — pnpm patches for @clerk/shared@4.18.0

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval generates React Query hooks + Zod schemas used by both server and client
- Expo targets web + native from one codebase; HTML5 video player on web
- Admin role is stored in the `users` table (`role` column: `'admin'` | `'viewer'`); set manually via SQL for the first admin
- Clerk auth: mobile uses bearer tokens via `setAuthTokenGetter`, web uses session cookies
- GCS object storage for video files; presigned upload URLs generated server-side

## Product

- Viewers: Browse lecture catalog, search/filter by tag/title, watch HTML5 videos
- Admins: Upload videos (direct to GCS via presigned URL), edit metadata, delete lectures, view stats dashboard
- Auth: Email + password with email verification; new accounts default to `viewer` role

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Clerk version pinning**: Use `@clerk/expo@3.4.3` exactly (not `^`). The `2.x` series is broken on web (requires @clerk/shared@5.x which doesn't exist). The `3.x` series uses @clerk/react@6.10.0 + @clerk/shared@4.18.0 which work correctly.
- **patchedDependencies** must be kept in sync in BOTH `package.json` AND `pnpm-workspace.yaml`. Removing a patch file without removing both references breaks `pnpm install`.
- **When upgrading @clerk/* packages**: delete `pnpm-lock.yaml` and run `pnpm install` to regenerate from scratch — the lockfile bakes in patch hashes that break when patches are removed.
- `<ClerkLoaded>` is REQUIRED in `_layout.tsx` — without it, auth hooks return undefined state before Clerk initializes, causing blank screens.
- Admin role: set manually via `UPDATE users SET role='admin' WHERE email='...'` after first sign-up.
- API routes under `/api` path; Clerk proxy under `/api/__clerk`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `lib/api-spec/openapi.yaml` for the API contract (source of truth)
- See `lib/db/src/schema.ts` for the database schema
