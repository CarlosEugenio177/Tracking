import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const conversionsTable = pgTable("conversions", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id"),
  leadId: text("lead_id"),
  revenue: numeric("revenue", { precision: 12, scale: 2 }).notNull(),
  platform: text("platform"),
  source: text("source"),
  medium: text("medium"),
  creative: text("creative"),
  adSpend: numeric("ad_spend", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversionSchema = createInsertSchema(
  conversionsTable,
).omit({ id: true, createdAt: true });
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversionsTable.$inferSelect;
