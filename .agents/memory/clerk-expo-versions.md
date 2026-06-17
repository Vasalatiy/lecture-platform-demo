---
name: Clerk Expo version fix
description: @clerk/expo 2.x is broken on Expo web; 3.x is required. How to upgrade and what breaks.
---

# @clerk/expo Version Requirements for Expo Web

## The rule
Always use `@clerk/expo@3.4.3` (exact version, no `^`). The `2.x` series (`2.19.0` was the latest 2.x stable) is fundamentally broken on Expo web because:
- `@clerk/expo@2.x` depends on `@clerk/react@5.54.0`
- `@clerk/react@5.54.0` calls `loadClerkUiScript` (lowercase) from `@clerk/shared`
- But it ships with `@clerk/shared@3.47.7` which only exports `loadClerkUIScript` (uppercase U)
- Forcing it to `@clerk/shared@4.18.0` fixes that but breaks `__experimental_CheckoutProvider` (undefined in 4.18.0)
- The correct shared version is `@clerk/shared@5.x` which doesn't exist in the registry yet (or doesn't match)

**Why:** `@clerk/expo@3.4.3` depends on `@clerk/react@6.10.0` + `@clerk/shared@4.18.0`, which are stable and compatible. The `3.x` dist-tag is `latest` even though npm might resolve `^2.10.6` to `2.19.0` (the latest `2.x`).

**How to apply:** When adding Clerk to any new Expo project, install `@clerk/expo@3.4.3` explicitly (not `^3.x` either — pin it to avoid future major bumps). After installing, run `pnpm --filter @workspace/mobile install` separately if pnpm workspace install doesn't link the mobile node_modules correctly.

## Required layout structure
`<ClerkLoaded>` MUST wrap the app content inside `<ClerkProvider>` in `_layout.tsx`. Without it, auth hooks return undefined state before Clerk initializes, causing blank screens with no error output.

```tsx
<ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
  <ClerkLoaded>
    {/* rest of app */}
  </ClerkLoaded>
</ClerkProvider>
```

## Upgrade procedure
1. Change `@clerk/expo` version in `artifacts/mobile/package.json` to exact `3.4.3`
2. Delete `pnpm-lock.yaml` (the lockfile bakes in patch hashes that are invalid after cleanup)
3. Run `pnpm install` (workspace-level)
4. Run `pnpm --filter @workspace/mobile install` (to ensure mobile node_modules symlinks are created)
5. Restart the mobile workflow
