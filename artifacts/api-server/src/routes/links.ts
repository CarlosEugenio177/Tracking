import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { linksTable, campaignsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireWorkspaceAccess } from "../middlewares/workspaceAuth";

const router = Router();

const PLATFORM_UTM_MAP: Record<string, { source: string; medium: string }> = {
  "Meta Ads": { source: "facebook", medium: "cpc" },
  "Google Ads": { source: "google", medium: "cpc" },
  "Instagram": { source: "instagram", medium: "social" },
  "TikTok": { source: "tiktok", medium: "cpc" },
  "LinkedIn": { source: "linkedin", medium: "cpc" },
  "Email": { source: "email", medium: "email" },
  "Organic": { source: "organic", medium: "organic" },
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

function buildUtmUrl(
  baseUrl: string,
  params: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  },
) {
  const url = new URL(baseUrl);
  if (params.utmSource) url.searchParams.set("utm_source", params.utmSource);
  if (params.utmMedium) url.searchParams.set("utm_medium", params.utmMedium);
  if (params.utmCampaign) url.searchParams.set("utm_campaign", params.utmCampaign);
  if (params.utmContent) url.searchParams.set("utm_content", params.utmContent);
  if (params.utmTerm) url.searchParams.set("utm_term", params.utmTerm);
  return url.toString();
}

// List links
router.get(
  "/workspaces/:workspaceId/links",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const { campaignId, search } = req.query as Record<string, string>;
    try {
      const links = await db
        .select({ link: linksTable, campaignName: campaignsTable.name })
        .from(linksTable)
        .leftJoin(campaignsTable, eq(linksTable.campaignId, campaignsTable.id))
        .where(eq(linksTable.workspaceId, workspaceId))
        .orderBy(sql`${linksTable.createdAt} desc`);

      let filtered = links;
      if (campaignId) {
        filtered = filtered.filter((l) => l.link.campaignId === Number(campaignId));
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.link.originalUrl.toLowerCase().includes(q) ||
            (l.link.utmCampaign ?? "").toLowerCase().includes(q),
        );
      }

      res.json(
        filtered.map((l) => ({
          ...l.link,
          campaignName: l.campaignName,
          createdAt: l.link.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create link
router.post(
  "/workspaces/:workspaceId/links",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const {
      originalUrl,
      campaignId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      responsible,
    } = req.body;

    if (!originalUrl) {
      res.status(400).json({ error: "originalUrl is required" });
      return;
    }

    try {
      const finalUrl = buildUtmUrl(originalUrl, {
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
      });

      const [link] = await db
        .insert(linksTable)
        .values({
          workspaceId,
          campaignId: campaignId ?? null,
          originalUrl,
          finalUrl,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          responsible,
        })
        .returning();

      res.status(201).json({
        ...link,
        campaignName: null,
        createdAt: link.createdAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get link
router.get(
  "/workspaces/:workspaceId/links/:linkId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const linkId = Number(req.params.linkId);
    try {
      const [link] = await db
        .select()
        .from(linksTable)
        .where(
          and(eq(linksTable.id, linkId), eq(linksTable.workspaceId, workspaceId)),
        );
      if (!link) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ ...link, campaignName: null, createdAt: link.createdAt.toISOString() });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete link
router.delete(
  "/workspaces/:workspaceId/links/:linkId",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const linkId = Number(req.params.linkId);
    try {
      await db
        .delete(linksTable)
        .where(
          and(eq(linksTable.id, linkId), eq(linksTable.workspaceId, workspaceId)),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Generate UTM
router.post(
  "/workspaces/:workspaceId/links/generate-utm",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const { baseUrl, platform, campaignName, creative, audience } = req.body;

    if (!baseUrl || !platform || !campaignName) {
      res.status(400).json({ error: "baseUrl, platform, and campaignName are required" });
      return;
    }

    const mapping = PLATFORM_UTM_MAP[platform] ?? {
      source: slugify(platform),
      medium: "cpc",
    };

    const utmSource = mapping.source;
    const utmMedium = mapping.medium;
    const utmCampaign = slugify(campaignName);
    const utmContent = creative ? slugify(creative) : null;
    const utmTerm = audience ? slugify(audience) : null;

    const finalUrl = buildUtmUrl(baseUrl, {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent: utmContent ?? undefined,
      utmTerm: utmTerm ?? undefined,
    });

    res.json({ finalUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm });
  },
);

// Validate link
router.post(
  "/workspaces/:workspaceId/links/validate",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    const parsedParams: Record<string, string> = {};

    try {
      const parsed = new URL(url);
      const params = parsed.searchParams;
      const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
      const requiredParams = ["utm_source", "utm_medium", "utm_campaign"];

      for (const p of utmParams) {
        const val = params.get(p);
        if (val) parsedParams[p] = val;
      }

      for (const p of requiredParams) {
        if (!params.has(p)) {
          issues.push(`Missing required parameter: ${p}`);
          suggestions.push(`Add ${p} to the URL`);
        }
      }

      for (const [k, v] of params.entries()) {
        if (k.startsWith("utm_")) {
          if (v.includes(" ")) {
            issues.push(`Parameter ${k} contains spaces — use underscores or hyphens`);
          }
          if (v !== v.toLowerCase()) {
            issues.push(`Parameter ${k} should be lowercase`);
            suggestions.push(`Change ${k}=${v} to ${k}=${v.toLowerCase()}`);
          }
        }
      }

      res.json({ valid: issues.length === 0, issues, suggestions, parsedParams });
    } catch {
      res.json({
        valid: false,
        issues: ["Invalid URL format"],
        suggestions: ["Check that the URL starts with http:// or https://"],
        parsedParams: {},
      });
    }
  },
);

export default router;
