import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { campaignsTable, conversionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

// List campaigns
router.get(
  "/workspaces/:workspaceId/campaigns",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { status, platform, search } = req.query as Record<string, string>;
    try {
      const campaigns = await db
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.workspaceId, workspaceId))
        .orderBy(sql`${campaignsTable.createdAt} desc`);

      let filtered = campaigns;
      if (status) filtered = filtered.filter((c) => c.status === status);
      if (platform) filtered = filtered.filter((c) => c.platform === platform);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.client ?? "").toLowerCase().includes(q),
        );
      }

      res.json(
        filtered.map((c) => ({
          ...c,
          budget: c.budget ? Number(c.budget) : null,
          tags: c.tags ?? [],
          updatedAt: c.updatedAt.toISOString(),
          createdAt: c.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create campaign
router.post(
  "/workspaces/:workspaceId/campaigns",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const {
      name,
      client,
      platform,
      objective,
      responsible,
      tags,
      status,
      budget,
      notes,
      startDate,
      endDate,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    try {
      const [campaign] = await db
        .insert(campaignsTable)
        .values({
          workspaceId,
          name,
          client,
          platform,
          objective,
          responsible,
          tags: tags ?? [],
          status: status ?? "draft",
          budget: budget ? String(budget) : null,
          notes,
          startDate,
          endDate,
        })
        .returning();

      res.status(201).json({
        ...campaign,
        budget: campaign.budget ? Number(campaign.budget) : null,
        tags: campaign.tags ?? [],
        updatedAt: campaign.updatedAt.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get campaign
router.get(
  "/workspaces/:workspaceId/campaigns/:campaignId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const campaignId = Number(req.params.campaignId);
    try {
      const [campaign] = await db
        .select()
        .from(campaignsTable)
        .where(
          and(
            eq(campaignsTable.id, campaignId),
            eq(campaignsTable.workspaceId, workspaceId),
          ),
        );
      if (!campaign) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({
        ...campaign,
        budget: campaign.budget ? Number(campaign.budget) : null,
        tags: campaign.tags ?? [],
        updatedAt: campaign.updatedAt.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update campaign
router.patch(
  "/workspaces/:workspaceId/campaigns/:campaignId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const campaignId = Number(req.params.campaignId);
    const updateData = req.body;

    try {
      const setData: Record<string, unknown> = { updatedAt: new Date() };
      if (updateData.name !== undefined) setData.name = updateData.name;
      if (updateData.client !== undefined) setData.client = updateData.client;
      if (updateData.platform !== undefined) setData.platform = updateData.platform;
      if (updateData.objective !== undefined) setData.objective = updateData.objective;
      if (updateData.responsible !== undefined) setData.responsible = updateData.responsible;
      if (updateData.tags !== undefined) setData.tags = updateData.tags;
      if (updateData.status !== undefined) setData.status = updateData.status;
      if (updateData.budget !== undefined)
        setData.budget = updateData.budget ? String(updateData.budget) : null;
      if (updateData.notes !== undefined) setData.notes = updateData.notes;
      if (updateData.startDate !== undefined) setData.startDate = updateData.startDate;
      if (updateData.endDate !== undefined) setData.endDate = updateData.endDate;

      const [campaign] = await db
        .update(campaignsTable)
        .set(setData as any)
        .where(
          and(
            eq(campaignsTable.id, campaignId),
            eq(campaignsTable.workspaceId, workspaceId),
          ),
        )
        .returning();

      if (!campaign) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.json({
        ...campaign,
        budget: campaign.budget ? Number(campaign.budget) : null,
        tags: campaign.tags ?? [],
        updatedAt: campaign.updatedAt.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete campaign
router.delete(
  "/workspaces/:workspaceId/campaigns/:campaignId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const campaignId = Number(req.params.campaignId);
    try {
      await db
        .delete(campaignsTable)
        .where(
          and(
            eq(campaignsTable.id, campaignId),
            eq(campaignsTable.workspaceId, workspaceId),
          ),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Campaign stats
router.get(
  "/workspaces/:workspaceId/campaigns/:campaignId/stats",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const campaignId = Number(req.params.campaignId);
    try {
      const [campaign] = await db
        .select()
        .from(campaignsTable)
        .where(
          and(
            eq(campaignsTable.id, campaignId),
            eq(campaignsTable.workspaceId, workspaceId),
          ),
        );
      if (!campaign) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const convData = await db
        .select({
          count: sql<number>`cast(count(*) as int)`,
          revenue: sql<number>`cast(coalesce(sum(cast(revenue as numeric)), 0) as float)`,
          spend: sql<number>`cast(coalesce(sum(cast(ad_spend as numeric)), 0) as float)`,
        })
        .from(conversionsTable)
        .where(
          and(
            eq(conversionsTable.workspaceId, workspaceId),
            eq(conversionsTable.campaignId, campaignId),
          ),
        );

      const { count: conversions, revenue, spend } = convData[0] ?? {
        count: 0,
        revenue: 0,
        spend: 0,
      };

      res.json({
        campaignId,
        campaignName: campaign.name,
        clicks: 0,
        leads: 0,
        conversions,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
