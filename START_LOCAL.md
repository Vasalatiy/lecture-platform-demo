# Local development on Windows

The local launcher reads backend secrets from
`artifacts/api-server/.env.local`. It does not pass backend variables to the
web app and does not print their values.

## First-time setup

1. Create `artifacts/web/.env.local`:

   ```dotenv
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

2. Copy `artifacts/api-server/.env.example` to
   `artifacts/api-server/.env.local`, then replace every placeholder with the
   real local value:

   ```dotenv
   DATABASE_URL=postgresql://user:password@host/db?sslmode=require
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   PORT=5000
   NODE_ENV=development
   STORAGE_DRIVER=local
   LOCAL_STORAGE_DIR=uploads
   ```

   Keep both `.env.local` files local. They are ignored by Git. Never put
   `CLERK_SECRET_KEY` in the web env file.

3. From the repository root, install dependencies if needed:

   ```powershell
   npx.cmd pnpm@latest install
   ```

4. Apply the database schema:

   ```powershell
   npx.cmd pnpm@latest db:push:local
   ```

5. Start the API and web app:

   ```powershell
   npx.cmd pnpm@latest dev:local
   ```

The API listens on port 5000 and the web PWA on port 5173. Press `Ctrl+C` to
stop both.

## Daily startup

Open VS Code, open this repository folder, and run from its root:

```powershell
npx.cmd pnpm@latest dev:local
```

Open <http://localhost:5173/debug-auth>, sign in if needed, and expect
`ok (admin)`.

## Individual commands

```powershell
npx.cmd pnpm@latest api:local
npx.cmd pnpm@latest web:local
npx.cmd pnpm@latest db:push:local
```
