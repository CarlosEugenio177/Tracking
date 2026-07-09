import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  trackingEventsTable,
  conversionsTable,
  campaignsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

router.get(
  "/workspaces/:workspaceId/dashboard",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);

    try {
      // Count events by type
      const eventCounts = await db
        .select({
          eventType: trackingEventsTable.eventType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(trackingEventsTable)
        .where(eq(trackingEventsTable.workspaceId, workspaceId))
        .groupBy(trackingEventsTable.eventType);

      const clicks =
        eventCounts.find((e) => e.eventType === "click")?.count ?? 0;
      const leads =
        eventCounts.find((e) => e.eventType === "lead")?.count ?? 0;

      // Revenue from conversions
      const convData = await db
        .select({
          count: sql<number>`cast(count(*) as int)`,
          totalRevenue: sql<number>`cast(coalesce(sum(cast(revenue as numeric)), 0) as float)`,
          totalSpend: sql<number>`cast(coalesce(sum(cast(ad_spend as numeric)), 0) as float)`,
        })
        .from(conversionsTable)
        .where(eq(conversionsTable.workspaceId, workspaceId));

      const { count: conversions, totalRevenue, totalSpend } = convData[0] ?? {
        count: 0,
        totalRevenue: 0,
        totalSpend: 0,
      };

      const revenue = totalRevenue;
      const roi = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0;
      const cpl = leads > 0 ? totalSpend / leads : 0;
      const cpa = conversions > 0 ? totalSpend / conversions : 0;
      const roas = totalSpend > 0 ? revenue / totalSpend : 0;

      // Top campaigns by revenue
      const topCampaigns = await db
        .select({
          campaignId: conversionsTable.campaignId,
          campaignName: campaignsTable.name,
          conversions: sql<number>`cast(count(*) as int)`,
          revenue: sql<number>`cast(coalesce(sum(cast(conversions.revenue as numeric)), 0) as float)`,
          roas: sql<number>`cast(case when sum(cast(ad_spend as numeric)) > 0 then sum(cast(conversions.revenue as numeric)) / sum(cast(ad_spend as numeric)) else 0 end as float)`,
        })
        .from(conversionsTable)
        .leftJoin(campaignsTable, eq(conversionsTable.campaignId, campaignsTable.id))
        .where(eq(conversionsTable.workspaceId, workspaceId))
        .groupBy(conversionsTable.campaignId, campaignsTable.name)
        .limit(5);

      const topCampaignsData = topCampaigns
        .filter((c) => c.campaignId !== null)
        .map((c) => ({
          campaignId: c.campaignId!,
          campaignName: c.campaignName ?? "Unknown",
          clicks: 0,
          leads: 0,
          conversions: c.conversions,
          revenue: c.revenue,
          roas: c.roas,
        }));

      res.json({
        clicks,
        leads,
        conversions,
        revenue,
        roi,
        cpl,
        cpa,
        roas,
        topCampaigns: topCampaignsData,
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get(
  "/workspaces/:workspaceId/dashboard/timeline",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);

    try {
      // Real aggregated daily counts for events (clicks / leads / sales) over last 30 days
      const eventRows = await db
        .select({
          date: sql<string>`to_char(date_trunc('day', timestamp), 'YYYY-MM-DD')`,
          eventType: trackingEventsTable.eventType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(trackingEventsTable)
        .where(
          and(
            eq(trackingEventsTable.workspaceId, workspaceId),
            sql`timestamp >= NOW() - INTERVAL '30 days'`,
          ),
        )
        .groupBy(
          sql`date_trunc('day', timestamp)`,
          trackingEventsTable.eventType,
        )
        .orderBy(sql`date_trunc('day', timestamp)`);

      const conversionRows = await db
        .select({
          date: sql<string>`to_char(date_trunc('day', created_at), 'YYYY-MM-DD')`,
          count: sql<number>`cast(count(*) as int)`,
          revenue: sql<number>`cast(coalesce(sum(cast(revenue as numeric)), 0) as float)`,
        })
        .from(conversionsTable)
        .where(
          and(
            eq(conversionsTable.workspaceId, workspaceId),
            sql`created_at >= NOW() - INTERVAL '30 days'`,
          ),
        )
        .groupBy(sql`date_trunc('day', created_at)`)
        .orderBy(sql`date_trunc('day', created_at)`);

      // Build a map of date → { clicks, leads, conversions, revenue }
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
      });

      const byDate = new Map<string, { clicks: number; leads: number; conversions: number; revenue: number }>();
      for (const day of days) {
        byDate.set(day, { clicks: 0, leads: 0, conversions: 0, revenue: 0 });
      }

      for (const row of eventRows) {
        const entry = byDate.get(row.date);
        if (!entry) continue;
        if (row.eventType === "click") entry.clicks = row.count;
        if (row.eventType === "lead") entry.leads = row.count;
        if (row.eventType === "sale") entry.conversions = row.count;
      }

      for (const row of conversionRows) {
        const entry = byDate.get(row.date);
        if (!entry) continue;
        entry.conversions = Math.max(entry.conversions, row.count);
        entry.revenue = row.revenue;
      }

      const timeline = days.map((date) => {
        const entry = byDate.get(date)!;
        return { date, ...entry };
      });

      res.json(timeline);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
