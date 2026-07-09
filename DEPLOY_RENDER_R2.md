# Deploy on Render Free with Neon and Cloudflare R2

This setup runs the API and built web PWA as one Render web service. The
browser keeps using relative `/api` URLs. Video files go directly from the
browser to Cloudflare R2 through short-lived presigned upload URLs; R2
credentials never reach the browser.

Render's free web services have an ephemeral filesystem and spin down after
15 minutes without inbound traffic. A cold start can take about a minute.
Never use `STORAGE_DRIVER=local` on Render: uploads would disappear after a
restart, redeploy, or spin-down. See the
[Render Free documentation](https://render.com/docs/free).

## 1. Create the Cloudflare R2 bucket

1. In Cloudflare, open **R2 Object Storage** and create a bucket.
2. Create an R2 API token scoped to this bucket with **Object Read & Write**
   permission. Save its Access Key ID and Secret Access Key once.
3. In the bucket's CORS settings, allow the Render service origin. Replace the
   example origin after Render assigns the final URL:

   ```json
   [
     {
       "AllowedOrigins": ["https://colostomy-care-school.onrender.com"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["Content-Type"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Add `http://localhost:5173` temporarily if testing R2 from local Vite.
   Browser uploads through presigned URLs require bucket CORS; see the
   [Cloudflare R2 CORS guide](https://developers.cloudflare.com/r2/buckets/cors/).

4. Keep the bucket private for authenticated, one-hour signed playback URLs.
   This is the recommended default.

   Alternatively, connect a public custom domain and set
   `R2_PUBLIC_BASE_URL=https://media.example.com`. Every stored video will then
   be publicly readable by URL. Do not use the rate-limited `r2.dev` address
   as a production media URL. See
   [Cloudflare's public bucket guide](https://developers.cloudflare.com/r2/buckets/public-buckets/).

The API defaults to Cloudflare's S3 endpoint:
`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`. Set `R2_ENDPOINT` only
when an explicit compatible endpoint is required.

## 2. Prepare Neon

Use the existing Neon PostgreSQL database. Copy its pooled, TLS-enabled
connection string into Render as `DATABASE_URL`. Apply the schema from a
trusted local machine before deployment:

```powershell
npx.cmd pnpm@latest db:push:local
```

This deployment does not modify database rows automatically.

## 3. Configure Clerk

1. Create or select the Clerk production instance.
2. Add the final Render URL (and later any custom domain) to Clerk's allowed
   origins/authorized parties and allowlisted redirect URLs.
3. Confirm `/login`, `/sign-up`, `/lectures`, and `/debug-auth` work on that
   domain.
4. Put the production keys in Render:
   `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and the same publishable key as
   `VITE_CLERK_PUBLISHABLE_KEY`.
5. Never put `CLERK_SECRET_KEY` in a `VITE_*` variable.

See [Clerk's production deployment guide](https://clerk.com/docs/guides/development/deployment/production).

## 4. Create the Render Free web service

The repository includes `render.yaml`, so a Render Blueprint can create the
service. Connect the GitHub repository, select the intended deployment branch,
choose the Free plan, and provide every secret marked `sync: false`.

For manual service setup, use the repository root and these commands:

**Build command**

```text
npx pnpm@11.10.0 install --frozen-lockfile && npx pnpm@11.10.0 build:render
```

**Start command**

```text
npx pnpm@11.10.0 --filter @workspace/api-server start
```

**Health check**

```text
/api/healthz
```

Render supplies `PORT`; the API listens on it at `0.0.0.0`. The production API
serves `artifacts/web/dist` and falls back to `index.html` for PWA routes such
as `/lectures` and `/debug-auth`.

### Required Render environment variables

```dotenv
NODE_ENV=production
STORAGE_DRIVER=r2
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
CLERK_SECRET_KEY=sk_live_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_BUCKET_NAME=your_bucket_name
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
```

Optional:

```dotenv
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://media.example.com
```

Do not set `LOCAL_STORAGE_DIR` for the Render production service. Do not
commit any of these real values.

## Manual test plans

### Local storage regression test

1. Keep `STORAGE_DRIVER=local` and `LOCAL_STORAGE_DIR=uploads` in
   `artifacts/api-server/.env.local`.
2. Run `npx.cmd pnpm@latest dev:local`.
3. Open `/debug-auth` and confirm `ok (admin)`.
4. In `/admin`, create one metadata-only material and one material with a
   small MP4, WebM, or MOV.
5. Open both from `/lectures`. Confirm the friendly missing-video message for
   the first and playback for the second.

### Local R2 integration test

1. Back up the local env file and set `STORAGE_DRIVER=r2` plus all required
   `R2_*` credentials. Leave `R2_PUBLIC_BASE_URL` unset to test private reads.
2. Add `http://localhost:5173` to the R2 bucket CORS allowed origins.
3. Run `npx.cmd pnpm@latest dev:local`.
4. Upload a small supported video in `/admin`.
5. Confirm an object appears under `r2/videos/` in the bucket.
6. Open the material and confirm the signed playback URL works.
7. Restore `STORAGE_DRIVER=local` after the test.

### Render deployment smoke test

1. Deploy and wait for `/api/healthz` to return a healthy response.
2. Open `/debug-auth`, sign in, and confirm `ok (admin)`.
3. Open `/lectures` directly and refresh it to verify the SPA fallback.
4. In `/admin`, create a metadata-only material and confirm its friendly
   message on the detail page.
5. Upload a small MP4, WebM, or MOV and verify the object appears in R2.
6. Open the published material as a patient and confirm seeking and playback.
7. Let the free service sleep, reopen it, and confirm the R2 video still plays
   after Render wakes. A local upload would not survive this test.
