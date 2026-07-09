---
name: DB package compilation
description: When new schema files are added to lib/db, the TypeScript declarations must be rebuilt before dependent packages (api-server) can typecheck.
---

When new schema files are added to `lib/db/src/schema/`, the compiled `.d.ts` files in `lib/db/dist/schema/` become stale. The api-server tsconfig uses project references (`composite: true`) so it reads from `dist/`, not `src/`.

**Rule:** After adding or modifying schema files in `lib/db`, run:
```
cd lib/db && npx tsc -p tsconfig.json --emitDeclarationOnly
```
before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** The `lib/db` package has `"composite": true` and `"emitDeclarationOnly": true`. TypeScript project references use the compiled `dist/*.d.ts` outputs, not source. A missing or stale `.d.ts` shows as "Module has no exported member" errors in the api-server even when the source is correct.

**How to apply:** Any time you see `Module '"@workspace/db"' has no exported member '...'` errors in the api-server, this is almost certainly a stale db dist. Rebuild db declarations first, then re-run typecheck.
