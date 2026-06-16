import { pgTable, serial, text, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  mobileNumber: text("mobile_number"),
  homeNumber: text("home_number"),
  whatsappNumber: text("whatsapp_number"),
  qualification: text("qualification").notNull().default(""),
  address: text("address"),
  joiningDate: date("joining_date", { mode: "string" }).notNull(),
  monthlySalary: integer("monthly_salary").notNull(),
  subjectsTaught: text("subjects_taught").notNull().default(""),
  assignedClass: text("assigned_class"),
  teachingAssignments: text("teaching_assignments").notNull().default(""),
  timetableNotes: text("timetable_notes").notNull().default(""),
  portalUsername: text("portal_username"),
  portalPassword: text("portal_password"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Teacher = typeof teachersTable.$inferSelect;
