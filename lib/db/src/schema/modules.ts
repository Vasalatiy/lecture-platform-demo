import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const modulesTable = pgTable(
  "modules",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("modules_course_id_position_idx").on(table.courseId, table.position)],
);

export const insertModuleSchema = createInsertSchema(modulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modulesTable.$inferSelect;
