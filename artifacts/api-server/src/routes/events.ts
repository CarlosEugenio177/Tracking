import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { trackingEventsTable, campaignsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

router.get(
  "/workspaces/:workspaceId/events",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { leadId, eventType, campaignId } = req.query as Record<string, string>;

    try {
      const events = await db
        .select({
          event: trackingEventsTable,
          campaignName: campaignsTable.name,
        })
        .from(trackingEventsTable)
        .leftJoin(
          campaignsTable,
          eq(trackingEventsTable.campaignId, campaignsTable.id),
        )
        .where(eq(trackingEventsTable.workspaceId, workspaceId))
        .orderBy(sql`${trackingEventsTable.timestamp} desc`)
        .limit(200);

      let filtered = events;
      if (leadId) {
        filtered = filtered.filter((e) => e.event.leadId === leadId);
      }
      if (eventType) {
        filtered = filtered.filter((e) => e.event.eventType === eventType);
      }
      if (campaignId) {
        filtered = filtered.filter(
          (e) => e.event.campaignId === Number(campaignId),
        );
      }

      res.json(
        filtered.map((e) => ({
          ...e.event,
          campaignName: e.campaignName,
          timestamp: e.event.timestamp.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
