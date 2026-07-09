import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const videoViewsTable = pgTable("video_views", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  userId: integer("user_id").notNull(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVideoViewSchema = createInsertSchema(videoViewsTable).omit({ id: true, viewedAt: true });
export type InsertVideoView = z.infer<typeof insertVideoViewSchema>;
export type VideoView = typeof videoViewsTable.$inferSelect;
