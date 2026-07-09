import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { webhookEndpointsTable, webhookEventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

function generateSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

/** Verifies the endpoint belongs to the given workspace — prevents cross-tenant access. */
async function getEndpointForWorkspace(
  endpointId: number,
  workspaceId: number,
) {
  const [endpoint] = await db
    .select()
    .from(webhookEndpointsTable)
    .where(
      and(
        eq(webhookEndpointsTable.id, endpointId),
        eq(webhookEndpointsTable.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return endpoint ?? null;
}

// List webhook endpoints
router.get(
  "/workspaces/:workspaceId/webhooks",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    try {
      const endpoints = await db
        .select({
          endpoint: webhookEndpointsTable,
          totalEvents: sql<number>`cast(count(${webhookEventsTable.id}) as int)`,
          lastEventAt: sql<string | null>`max(${webhookEventsTable.timestamp})`,
        })
        .from(webhookEndpointsTable)
        .leftJoin(
          webhookEventsTable,
          eq(webhookEventsTable.endpointId, webhookEndpointsTable.id),
        )
        .where(eq(webhookEndpointsTable.workspaceId, workspaceId))
        .groupBy(webhookEndpointsTable.id)
        .orderBy(sql`${webhookEndpointsTable.createdAt} desc`);

      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost";

      res.json(
        endpoints.map((e) => ({
          ...e.endpoint,
          url: `${host}/api/webhook/${e.endpoint.slug}`,
          totalEvents: e.totalEvents,
          lastEventAt: e.lastEventAt,
          createdAt: e.endpoint.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create webhook endpoint
router.post(
  "/workspaces/:workspaceId/webhooks",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    try {
      const slug = generateSlug(name);
      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost";

      const [endpoint] = await db
        .insert(webhookEndpointsTable)
        .values({ workspaceId, name, slug, description })
        .returning();

      res.status(201).json({
        ...endpoint,
        url: `${host}/api/webhook/${slug}`,
        totalEvents: 0,
        lastEventAt: null,
        createdAt: endpoint.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get webhook endpoint detail
router.get(
  "/workspaces/:workspaceId/webhooks/:endpointId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const endpointId = Number(req.params.endpointId);
    try {
      const endpoint = await getEndpointForWorkspace(endpointId, workspaceId);
      if (!endpoint) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const recentEvents = await db
        .select()
        .from(webhookEventsTable)
        .where(eq(webhookEventsTable.endpointId, endpointId))
        .orderBy(sql`${webhookEventsTable.timestamp} desc`)
        .limit(50);

      const totalEvents = recentEvents.length;
      const lastEventAt =
        recentEvents.length > 0 ? recentEvents[0].timestamp.toISOString() : null;

      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost";

      res.json({
        ...endpoint,
        url: `${host}/api/webhook/${endpoint.slug}`,
        totalEvents,
        lastEventAt,
        createdAt: endpoint.createdAt.toISOString(),
        recentEvents: recentEvents.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete webhook endpoint
router.delete(
  "/workspaces/:workspaceId/webhooks/:endpointId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const endpointId = Number(req.params.endpointId);
    try {
      const endpoint = await getEndpointForWorkspace(endpointId, workspaceId);
      if (!endpoint) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      await db
        .delete(webhookEndpointsTable)
        .where(eq(webhookEndpointsTable.id, endpointId));
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// List webhook events
router.get(
  "/workspaces/:workspaceId/webhooks/:endpointId/events",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const endpointId = Number(req.params.endpointId);
    const { status } = req.query as Record<string, string>;
    try {
      // Verify endpoint belongs to workspace before exposing events
      const endpoint = await getEndpointForWorkspace(endpointId, workspaceId);
      if (!endpoint) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const events = await db
        .select()
        .from(webhookEventsTable)
        .where(eq(webhookEventsTable.endpointId, endpointId))
        .orderBy(sql`${webhookEventsTable.timestamp} desc`)
        .limit(100);

      let filtered = events;
      if (status) filtered = filtered.filter((e) => e.status === status);

      res.json(filtered.map((e) => ({ ...e, timestamp: e.timestamp.toISOString() })));
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Resend webhook event
router.post(
  "/workspaces/:workspaceId/webhooks/:endpointId/events/:eventId/resend",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const endpointId = Number(req.params.endpointId);
    const eventId = Number(req.params.eventId);
    try {
      // Verify endpoint belongs to workspace
      const endpoint = await getEndpointForWorkspace(endpointId, workspaceId);
      if (!endpoint) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const [event] = await db
        .select()
        .from(webhookEventsTable)
        .where(
          and(
            eq(webhookEventsTable.id, eventId),
            eq(webhookEventsTable.endpointId, endpointId),
          ),
        );

      if (!event) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const [newEvent] = await db
        .insert(webhookEventsTable)
        .values({
          endpointId: event.endpointId,
          method: event.method,
          headers: event.headers ?? {},
          payload: event.payload ?? {},
          statusCode: 200,
          ip: event.ip,
          origin: event.origin,
          status: "received",
        })
        .returning();

      res.json({ ...newEvent, timestamp: newEvent.timestamp.toISOString() });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Public webhook receiver — no auth required (it's a public inbound endpoint)
router.all("/webhook/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const [endpoint] = await db
      .select()
      .from(webhookEndpointsTable)
      .where(eq(webhookEndpointsTable.slug, slug));

    if (!endpoint) {
      res.status(404).json({ error: "Webhook endpoint not found" });
      return;
    }

    await db.insert(webhookEventsTable).values({
      endpointId: endpoint.id,
      method: req.method,
      headers: req.headers as Record<string, string>,
      payload:
        typeof req.body === "object" ? req.body : { raw: String(req.body) },
      statusCode: 200,
      ip: req.ip ?? null,
      origin: req.headers.origin ?? null,
      status: "received",
    });

    res.json({ ok: true, received: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
