import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { workspacesTable, workspaceMembersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

// List workspaces for current user
router.get("/workspaces", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    // Workspaces user owns
    const owned = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.ownerClerkId, userId));

    // Workspaces user is a member of
    const memberships = await db
      .select({ workspaceId: workspaceMembersTable.workspaceId })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.clerkUserId, userId));

    const memberIds = memberships
      .map((m) => m.workspaceId)
      .filter((id) => !owned.find((w) => w.id === id));

    const memberWorkspaces =
      memberIds.length > 0
        ? await db
            .select()
            .from(workspacesTable)
            .where(inArray(workspacesTable.id, memberIds))
        : [];

    const all = [...owned, ...memberWorkspaces];

    // Auto-onboarding: Create a default workspace if the user has none
    if (all.length === 0) {
      try {
        const [workspace] = await db
          .insert(workspacesTable)
          .values({
            name: "Meu Workspace",
            slug: `workspace-${userId.substring(userId.length - 6).toLowerCase()}`,
            ownerClerkId: userId,
          })
          .returning();
          
        await db
          .insert(workspaceMembersTable)
          .values({ workspaceId: workspace.id, clerkUserId: userId, role: "owner" });
          
        all.push(workspace);
      } catch (insertErr) {
        req.log.error(insertErr, "Failed to auto-create default workspace");
      }
    }

    res.json(
      all.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create workspace
router.post("/workspaces", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { name, slug, logoUrl } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: "name and slug are required" });
    return;
  }
  try {
    const [workspace] = await db
      .insert(workspacesTable)
      .values({ name, slug, logoUrl, ownerClerkId: userId })
      .returning();
    await db
      .insert(workspaceMembersTable)
      .values({ workspaceId: workspace.id, clerkUserId: userId, role: "owner" });
    res.status(201).json({ ...workspace, createdAt: workspace.createdAt.toISOString() });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "Slug already taken" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get workspace — requires membership
router.get(
  "/workspaces/:workspaceId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const id = Number(req.params.workspaceId);
    try {
      const [workspace] = await db
        .select()
        .from(workspacesTable)
        .where(eq(workspacesTable.id, id));
      if (!workspace) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ ...workspace, createdAt: workspace.createdAt.toISOString() });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update workspace — requires membership
router.patch(
  "/workspaces/:workspaceId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const id = Number(req.params.workspaceId);
    const { name, slug, logoUrl } = req.body;
    try {
      const [workspace] = await db
        .update(workspacesTable)
        .set({
          ...(name && { name }),
          ...(slug && { slug }),
          ...(logoUrl !== undefined && { logoUrl }),
          updatedAt: new Date(),
        })
        .where(eq(workspacesTable.id, id))
        .returning();
      if (!workspace) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ ...workspace, createdAt: workspace.createdAt.toISOString() });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
