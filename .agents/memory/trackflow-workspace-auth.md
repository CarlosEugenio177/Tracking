---
name: TrackFlow workspace authorization
description: Multi-tenant auth pattern used in all workspace-scoped API routes.
---

All routes under `/workspaces/:workspaceId/**` use two middleware layers:
1. `requireAuth` — extracts `userId` from Clerk session, attaches to `req.userId`
2. `requireWorkspaceAccess` — verifies the user owns or is a member of the workspace

**Why:** Without `requireWorkspaceAccess`, any authenticated user could access other tenants' data by guessing a `workspaceId` (IDOR vulnerability). Membership check must cover both ownership (`workspaces.owner_clerk_id`) and membership table.

**How to apply:** Every new router that is workspace-scoped must include both middlewares:
```ts
router.get("/workspaces/:workspaceId/...", requireAuth, requireWorkspaceAccess, handler)
```
The public webhook receiver (`/webhook/:slug`) is intentionally excluded — it's a public inbound endpoint, no auth needed.

Sub-resource access (e.g. webhook events by endpointId) must also verify the sub-resource belongs to the workspace — use `getEndpointForWorkspace(endpointId, workspaceId)` pattern rather than only checking the workspace in middleware.
