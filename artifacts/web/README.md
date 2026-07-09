# Lecture Platform Web

This package is the primary browser/PWA entry for the lecture platform. It uses Vite, React, TypeScript, Clerk React, and TanStack React Query.

The web app calls the backend only through relative `/api` paths. During local development, Vite proxies `/api` to the Express API server. Set `API_PROXY_TARGET` if the API server runs somewhere other than the default development target.

Required environment variables:

- `VITE_CLERK_PUBLISHABLE_KEY`: browser-safe Clerk publishable key for the web PWA.
- `CLERK_PUBLISHABLE_KEY`: backend Clerk publishable key used by the Express server.
- `CLERK_SECRET_KEY`: backend Clerk secret key used by the Express server.

For local web development, copy `artifacts/web/.env.example` to `artifacts/web/.env.local` and put the Clerk publishable key there:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

The frontend key must start with `pk_test_` or `pk_live_`. Never place a Clerk secret key starting with `sk_test_` or `sk_live_` in `artifacts/web/.env.local` or any frontend file. Copy the publishable key from Replit Secrets or the Clerk Dashboard.

For local Vite development, make sure the Clerk app allows these development URLs in its redirect/origin settings:

- `http://localhost:5173`
- `http://localhost:5173/login`
- `http://localhost:5173/lectures`
- `http://localhost:5173/debug-auth`

Local sign-in test:

1. Restart the Vite dev server after changing `artifacts/web/.env.local`.
2. Open `http://localhost:5173/login`.
3. Click **Sign in** and complete the Clerk modal flow.
4. Expect the page header to show `Auth: signed in`.
5. Open `/debug-auth` and verify `Clerk signed in: yes` and `Token available: available`.

The web app sends Clerk bearer tokens to `/api` requests and also uses `credentials: "include"` for same-origin cookie compatibility. Do not commit Clerk secret keys.

For local API/database setup, see `../api-server/LOCAL_DB.md`. Replit-internal database hosts such as `helium` do not resolve from local Windows; use an externally reachable PostgreSQL URL or local Docker PostgreSQL.

Local video upload development is supported by the API server with `STORAGE_DRIVER=local`. With that enabled, the admin page can upload MP4, WebM, or MOV files to `artifacts/api-server/uploads/videos`, create a lecture record with a `local/videos/<uuid>.<ext>` object path, and play it through the browser-native video element. The upload directory is ignored by git. See `../api-server/LOCAL_DB.md` for exact API server environment variables.

Production direction:

1. Build the web app with `pnpm --filter @workspace/web build`.
2. Keep Express API routes mounted before static handling with `app.use("/api", router)`.
3. Serve `artifacts/web/dist` as static assets after the API routes.
4. Add an SPA fallback to `index.html` for non-API paths.

Do not cache private `/api` responses or lecture video responses in a service worker without a deliberate privacy review.
