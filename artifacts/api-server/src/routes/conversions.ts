import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversionsTable, campaignsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

// List conversions
router.get(
  "/workspaces/:workspaceId/conversions",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { campaignId } = req.query as Record<string, string>;

    try {
      const conversions = await db
        .select({ conversion: conversionsTable, campaignName: campaignsTable.name })
        .from(conversionsTable)
        .leftJoin(campaignsTable, eq(conversionsTable.campaignId, campaignsTable.id))
        .where(eq(conversionsTable.workspaceId, workspaceId))
        .orderBy(sql`${conversionsTable.createdAt} desc`);

      let filtered = conversions;
      if (campaignId) {
        filtered = filtered.filter(
          (c) => c.conversion.campaignId === Number(campaignId),
        );
      }

      res.json(
        filtered.map((c) => ({
          ...c.conversion,
          revenue: Number(c.conversion.revenue),
          adSpend: c.conversion.adSpend ? Number(c.conversion.adSpend) : null,
          campaignName: c.campaignName,
          createdAt: c.conversion.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create conversion
router.post(
  "/workspaces/:workspaceId/conversions",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { campaignId, leadId, revenue, platform, source, medium, creative, adSpend } =
      req.body;

    if (revenue === undefined || revenue === null) {
      res.status(400).json({ error: "revenue is required" });
      return;
    }

    try {
      const [conversion] = await db
        .insert(conversionsTable)
        .values({
          workspaceId,
          campaignId: campaignId ?? null,
          leadId,
          revenue: String(revenue),
          platform,
          source,
          medium,
          creative,
          adSpend: adSpend ? String(adSpend) : null,
        })
        .returning();

      res.status(201).json({
        ...conversion,
        revenue: Number(conversion.revenue),
        adSpend: conversion.adSpend ? Number(conversion.adSpend) : null,
        campaignName: null,
        createdAt: conversion.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Conversion summary
router.get(
  "/workspaces/:workspaceId/conversions/summary",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);

    try {
      const allConversions = await db
        .select({ conversion: conversionsTable, campaignName: campaignsTable.name })
        .from(conversionsTable)
        .leftJoin(campaignsTable, eq(conversionsTable.campaignId, campaignsTable.id))
        .where(eq(conversionsTable.workspaceId, workspaceId));

      const totalRevenue = allConversions.reduce(
        (sum, c) => sum + Number(c.conversion.revenue),
        0,
      );
      const totalConversions = allConversions.length;
      const averageTicket = totalConversions > 0 ? totalRevenue / totalConversions : 0;

      type Bucket = { label: string; conversions: number; revenue: number; spend: number };

      const byCampaign = Object.values(
        allConversions
          .filter((c) => c.conversion.campaignId)
          .reduce((acc, c) => {
            const key = String(c.conversion.campaignId);
            if (!acc[key]) {
              acc[key] = { label: c.campaignName ?? "Unknown", conversions: 0, revenue: 0, spend: 0 };
            }
            acc[key].conversions++;
            acc[key].revenue += Number(c.conversion.revenue);
            acc[key].spend += Number(c.conversion.adSpend ?? 0);
            return acc;
          }, {} as Record<string, Bucket>),
      ).map((b) => ({
        label: b.label,
        conversions: b.conversions,
        revenue: b.revenue,
        roas: b.spend > 0 ? b.revenue / b.spend : null,
      }));

      const byPlatform = (Object.values(
        allConversions
          .filter((c) => c.conversion.platform)
          .reduce((acc, c) => {
            const key = c.conversion.platform!;
            if (!acc[key]) acc[key] = { label: key, conversions: 0, revenue: 0, spend: 0 };
            acc[key].conversions++;
            acc[key].revenue += Number(c.conversion.revenue);
            return acc;
          }, {} as Record<string, Bucket>),
      ) as Bucket[]).map((b) => ({ label: b.label, conversions: b.conversions, revenue: b.revenue, roas: null }));

      const byCreative = (Object.values(
        allConversions
          .filter((c) => c.conversion.creative)
          .reduce((acc, c) => {
            const key = c.conversion.creative!;
            if (!acc[key]) acc[key] = { label: key, conversions: 0, revenue: 0, spend: 0 };
            acc[key].conversions++;
            acc[key].revenue += Number(c.conversion.revenue);
            return acc;
          }, {} as Record<string, Bucket>),
      ) as Bucket[]).map((b) => ({ label: b.label, conversions: b.conversions, revenue: b.revenue, roas: null }));

      res.json({ totalRevenue, totalConversions, averageTicket, byCampaign, byPlatform, byCreative });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
