import { type Request, type Response, type NextFunction } from "express";
import { eq, and, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { workspacesTable, workspaceMembersTable } from "@workspace/db";

/**
 * Verifies the authenticated user is a member or owner of the workspace
 * specified in req.params.workspaceId. Must be used after requireAuth.
 */
export async function requireWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req as any).userId as string;
  const workspaceId = Number(req.params.workspaceId);

  if (!workspaceId || isNaN(workspaceId)) {
    res.status(400).json({ error: "Invalid workspaceId" });
    return;
  }

  try {
    // Check ownership
    const [owned] = await db
      .select({ id: workspacesTable.id })
      .from(workspacesTable)
      .where(
        and(
          eq(workspacesTable.id, workspaceId),
          eq(workspacesTable.ownerClerkId, userId),
        ),
      )
      .limit(1);

    if (owned) {
      next();
      return;
    }

    // Check membership
    const [member] = await db
      .select({ id: workspaceMembersTable.id })
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, workspaceId),
          eq(workspaceMembersTable.clerkUserId, userId),
        ),
      )
      .limit(1);

    if (member) {
      next();
      return;
    }

    res.status(403).json({ error: "Forbidden: not a member of this workspace" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
