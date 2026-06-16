import { pgTable, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const feeRecordsTable = pgTable("fee_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: integer("amount").notNull(),
  paid: boolean("paid").notNull().default(false),
  paidDate: date("paid_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeeRecordSchema = createInsertSchema(feeRecordsTable).omit({ id: true, createdAt: true });
export type InsertFeeRecord = z.infer<typeof insertFeeRecordSchema>;
export type FeeRecord = typeof feeRecordsTable.$inferSelect;
