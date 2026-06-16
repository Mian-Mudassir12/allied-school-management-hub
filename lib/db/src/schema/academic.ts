import { pgTable, serial, text, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";

export const classSubjectsTable = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  bookName: text("book_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schoolHolidaysTable = pgTable("school_holidays", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  scope: text("scope").notNull().default("school"),
  class: text("class"),
  reason: text("reason").notNull().default("Holiday"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timetableAssignmentsTable = pgTable("timetable_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  weekday: text("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teacherAttendanceTable = pgTable("teacher_attendance", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  present: boolean("present").notNull().default(false),
  status: text("status").notNull().default("OFF / Absent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examPapersTable = pgTable("exam_papers", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id"),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  class: text("class").notNull(),
  examType: text("exam_type").notNull(),
  totalMarks: integer("total_marks").notNull().default(100),
  chapterFrom: text("chapter_from").notNull().default(""),
  chapterTo: text("chapter_to").notNull().default(""),
  lessonScope: text("lesson_scope").notNull().default(""),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examResultsTable = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  paperId: integer("paper_id"),
  subject: text("subject").notNull(),
  class: text("class").notNull(),
  totalMarks: integer("total_marks").notNull(),
  obtainedMarks: integer("obtained_marks").notNull(),
  percentage: integer("percentage").notNull(),
  grade: text("grade").notNull(),
  status: text("status").notNull(),
  position: integer("position"),
  checkedPaperUrl: text("checked_paper_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syllabusPlansTable = pgTable("syllabus_plans", {
  id: serial("id").primaryKey(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  planDate: date("plan_date", { mode: "string" }).notNull(),
  chapterName: text("chapter_name").notNull(),
  lesson: text("lesson").notNull(),
  contentScope: text("content_scope").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homeworkDiariesTable = pgTable("homework_diaries", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id"),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  diaryDate: date("diary_date", { mode: "string" }).notNull(),
  taughtToday: text("taught_today").notNull().default(""),
  homework: text("homework").notNull(),
  dispatchStatus: text("dispatch_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
