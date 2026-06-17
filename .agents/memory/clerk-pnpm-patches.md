---
name: Clerk pnpm patch cleanup
description: pnpm patches must be removed from both package.json AND pnpm-workspace.yaml. How to safely clean up.
---

# pnpm Patch Cleanup for @clerk/shared

## The rule
When removing a pnpm patch (e.g., for `@clerk/shared@3.47.7`), you must remove it from **both**:
1. Root `package.json` → `pnpm.patchedDependencies` object
2. `pnpm-workspace.yaml` → `patchedDependencies` section

**Why:** pnpm reads `patchedDependencies` from both locations and will fail if a patch file is referenced but doesn't exist (`ENOENT: no such file or directory`). The lockfile also bakes in patch hashes — even after removing from config, the lockfile may still reference the old patch hash.

**How to apply:**
1. Remove the patch entry from `pnpm-workspace.yaml` patchedDependencies
2. Remove the same entry from root `package.json` pnpm.patchedDependencies
3. Delete the physical patch file (`patches/@clerk__shared@3.47.7.patch`)
4. Delete `pnpm-lock.yaml` (it has embedded patch hashes that will cause ENOENT)
5. Run `pnpm install` to regenerate the lockfile

## @clerk/shared@4.18.0 patch (kept)
The `patches/@clerk__shared@4.18.0.patch` is still needed — it adds the `loadClerkUiScript` alias that @clerk/expo@3.x / @clerk/react@6.x needs. This patch is registered in both `package.json` and `pnpm-workspace.yaml`.
