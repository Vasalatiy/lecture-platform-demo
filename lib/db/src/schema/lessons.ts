import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modulesTable } from "./modules";
import { videosTable } from "./videos";

export const lessonsTable = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id").notNull().references(() => modulesTable.id, { onDelete: "cascade" }),
    videoId: integer("video_id").references(() => videosTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    position: integer("position").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    estimatedDurationSeconds: integer("estimated_duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("lessons_module_id_position_idx").on(table.moduleId, table.position)],
);

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
