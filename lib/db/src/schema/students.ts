import { pgTable, serial, text, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNumber: text("roll_number").notNull().unique(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  section: text("section"),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name"),
  phone: text("phone").notNull(),
  fatherPhone: text("father_phone"),
  homePhone: text("home_phone"),
  whatsappNumber: text("whatsapp_number"),
  hasWhatsapp: boolean("has_whatsapp").notNull().default(true),
  address: text("address"),
  admissionDate: date("admission_date", { mode: "string" }).notNull(),
  monthlyFee: integer("monthly_fee").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  leftDate: date("left_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
