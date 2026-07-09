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

export const webhookEndpointsTable = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookEventsTable = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  endpointId: integer("endpoint_id")
    .notNull()
    .references(() => webhookEndpointsTable.id, { onDelete: "cascade" }),
  method: text("method").notNull().default("POST"),
  headers: jsonb("headers").$type<Record<string, string>>().default({}),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  statusCode: integer("status_code").notNull().default(200),
  ip: text("ip"),
  origin: text("origin"),
  status: text("status").notNull().default("received"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertWebhookEndpointSchema = createInsertSchema(
  webhookEndpointsTable,
).omit({ id: true, createdAt: true });
export type InsertWebhookEndpoint = z.infer<
  typeof insertWebhookEndpointSchema
>;
export type WebhookEndpoint = typeof webhookEndpointsTable.$inferSelect;

export const insertWebhookEventSchema = createInsertSchema(
  webhookEventsTable,
).omit({ id: true, timestamp: true });
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
