import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const trackingEventsTable = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // click, lead, webhook, crm, sale
  leadId: text("lead_id"),
  campaignId: integer("campaign_id"),
  source: text("source"),
  medium: text("medium"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertTrackingEventSchema = createInsertSchema(
  trackingEventsTable,
).omit({ id: true, timestamp: true });
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEventsTable.$inferSelect;
