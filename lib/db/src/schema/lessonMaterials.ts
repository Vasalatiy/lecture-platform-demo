import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { lessonsTable } from "./lessons";

export const lessonMaterialsTable = pgTable(
  "lesson_materials",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["text", "image"] }).notNull(),
    position: integer("position").notNull().default(0),
    textContent: text("text_content"),
    imageUrl: text("image_url"),
    altText: text("alt_text"),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("lesson_materials_lesson_id_position_idx").on(table.lessonId, table.position)],
);

export const insertLessonMaterialSchema = createInsertSchema(lessonMaterialsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLessonMaterial = z.infer<typeof insertLessonMaterialSchema>;
export type LessonMaterial = typeof lessonMaterialsTable.$inferSelect;
