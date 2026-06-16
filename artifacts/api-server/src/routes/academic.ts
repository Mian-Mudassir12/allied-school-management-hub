import { Router, type IRouter, type Request } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  classSubjectsTable,
  db,
  examPapersTable,
  examResultsTable,
  schoolHolidaysTable,
  syllabusPlansTable,
  teacherAttendanceTable,
  teachersTable,
  timetableAssignmentsTable,
  studentsTable,
} from "@workspace/db";

const router: IRouter = Router();

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (first || req.socket.remoteAddress || req.ip || "").replace("::ffff:", "");
}

function isSchoolNetwork(req: Request) {
  const ip = clientIp(req);
  const allowed = (process.env["SCHOOL_ALLOWED_IPS"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowed.length === 0) {
    return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.");
  }
  return allowed.some((prefix) => ip === prefix || ip.startsWith(prefix));
}

router.get("/academic/subjects", async (req, res): Promise<void> => {
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const rows = await db.select().from(classSubjectsTable).orderBy(classSubjectsTable.class, classSubjectsTable.subject);
  res.json(studentClass ? rows.filter((row) => row.class === studentClass) : rows);
});

router.get("/teacher-portal/network-status", (req, res): void => {
  res.json({ allowed: isSchoolNetwork(req), ip: clientIp(req) });
});

router.get("/teacher-portal/:teacherId/attendance", async (req, res): Promise<void> => {
  const teacherId = parseInt(req.params.teacherId);
  if (isNaN(teacherId)) {
    res.status(400).json({ error: "Invalid teacher id" });
    return;
  }
  const records = await db
    .select()
    .from(teacherAttendanceTable)
    .where(eq(teacherAttendanceTable.teacherId, teacherId))
    .orderBy(teacherAttendanceTable.date);
  res.json(records);
});

router.post("/teacher-portal/:teacherId/attendance", async (req, res): Promise<void> => {
  if (!isSchoolNetwork(req)) {
    res.status(403).json({ error: "Attendance can only be marked from school Wi-Fi/network." });
    return;
  }
  const teacherId = parseInt(req.params.teacherId);
  const body = req.body as Record<string, unknown>;
  const date = typeof body.date === "string" ? body.date : new Date().toISOString().slice(0, 10);
  if (isNaN(teacherId)) {
    res.status(400).json({ error: "Invalid teacher id" });
    return;
  }
  const existing = await db.select().from(teacherAttendanceTable).where(
    and(eq(teacherAttendanceTable.teacherId, teacherId), eq(teacherAttendanceTable.date, date))
  );
  if (existing.length > 0) {
    const [row] = await db.update(teacherAttendanceTable)
      .set({ present: true, status: "Present" })
      .where(eq(teacherAttendanceTable.id, existing[0].id))
      .returning();
    res.json(row);
    return;
  }
  const [row] = await db.insert(teacherAttendanceTable).values({ teacherId, date, present: true, status: "Present" }).returning();
  res.status(201).json(row);
});

router.post("/academic/subjects", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const studentClass = typeof body.class === "string" ? body.class.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bookName = typeof body.bookName === "string" ? body.bookName.trim() : "";
  if (!studentClass || !subject) {
    res.status(400).json({ error: "Class and subject are required" });
    return;
  }
  const [row] = await db.insert(classSubjectsTable).values({ class: studentClass, subject, bookName }).returning();
  res.status(201).json(row);
});

router.delete("/academic/subjects/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid subject id" });
    return;
  }
  const [row] = await db.delete(classSubjectsTable).where(eq(classSubjectsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/academic/holidays", async (req, res): Promise<void> => {
  const date = typeof req.query.date === "string" ? req.query.date : "";
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const rows = await db.select().from(schoolHolidaysTable).orderBy(schoolHolidaysTable.date);
  const filtered = rows.filter((row) => {
    if (date && row.date !== date) return false;
    if (studentClass && row.scope === "class" && row.class !== studentClass) return false;
    return true;
  });
  res.json(filtered);
});

router.post("/academic/holidays", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const date = typeof body.date === "string" ? body.date : "";
  const scope = body.scope === "class" ? "class" : "school";
  const studentClass = scope === "class" && typeof body.class === "string" ? body.class : null;
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Holiday";
  if (!date || (scope === "class" && !studentClass)) {
    res.status(400).json({ error: "Holiday date and class/school scope are required" });
    return;
  }
  const [row] = await db.insert(schoolHolidaysTable).values({ date, scope, class: studentClass, reason }).returning();
  res.status(201).json(row);
});

router.delete("/academic/holidays/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid holiday id" });
    return;
  }
  const [row] = await db.delete(schoolHolidaysTable).where(eq(schoolHolidaysTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Holiday not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/academic/timetable", async (req, res): Promise<void> => {
  const teacherId = typeof req.query.teacherId === "string" ? parseInt(req.query.teacherId) : null;
  const rows = await db
    .select({
      id: timetableAssignmentsTable.id,
      teacherId: timetableAssignmentsTable.teacherId,
      teacherName: teachersTable.name,
      class: timetableAssignmentsTable.class,
      subject: timetableAssignmentsTable.subject,
      weekday: timetableAssignmentsTable.weekday,
      startTime: timetableAssignmentsTable.startTime,
      endTime: timetableAssignmentsTable.endTime,
    })
    .from(timetableAssignmentsTable)
    .innerJoin(teachersTable, eq(timetableAssignmentsTable.teacherId, teachersTable.id))
    .orderBy(timetableAssignmentsTable.weekday, timetableAssignmentsTable.startTime);
  res.json(teacherId ? rows.filter((row) => row.teacherId === teacherId) : rows);
});

router.post("/academic/timetable", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const teacherId = typeof body.teacherId === "number" ? body.teacherId : parseInt(String(body.teacherId ?? ""));
  const studentClass = typeof body.class === "string" ? body.class : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const weekday = typeof body.weekday === "string" ? body.weekday : "";
  const startTime = typeof body.startTime === "string" ? body.startTime : "";
  const endTime = typeof body.endTime === "string" ? body.endTime : "";
  if (!teacherId || !studentClass || !subject || !weekday || !startTime || !endTime) {
    res.status(400).json({ error: "Teacher, class, subject, day and time are required" });
    return;
  }
  const [row] = await db.insert(timetableAssignmentsTable).values({
    teacherId,
    class: studentClass,
    subject,
    weekday,
    startTime,
    endTime,
  }).returning();
  res.status(201).json(row);
});

router.post("/teacher-portal/exam-papers", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const teacherId = typeof body.teacherId === "number" ? body.teacherId : parseInt(String(body.teacherId ?? ""));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const studentClass = typeof body.class === "string" ? body.class : "";
  const examType = typeof body.examType === "string" ? body.examType : "Class Test";
  const totalMarks = parseInt(String(body.totalMarks ?? "100")) || 100;
  const chapterFrom = typeof body.chapterFrom === "string" ? body.chapterFrom : "";
  const chapterTo = typeof body.chapterTo === "string" ? body.chapterTo : "";
  const lessonScope = typeof body.lessonScope === "string" ? body.lessonScope : "";
  const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : "";
  if (!teacherId || !title || !subject || !studentClass) {
    res.status(400).json({ error: "Teacher, title, class and subject are required" });
    return;
  }
  const [row] = await db.insert(examPapersTable).values({ teacherId, title, subject, class: studentClass, examType, totalMarks, chapterFrom, chapterTo, lessonScope, fileUrl }).returning();
  res.status(201).json(row);
});

router.get("/teacher-portal/exam-papers", async (req, res): Promise<void> => {
  const teacherId = typeof req.query.teacherId === "string" ? parseInt(req.query.teacherId) : null;
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const subject = typeof req.query.subject === "string" ? req.query.subject : "";
  const rows = await db.select().from(examPapersTable).orderBy(examPapersTable.createdAt);
  res.json(rows.filter((row) =>
    (!teacherId || row.teacherId === teacherId)
    && (!studentClass || row.class === studentClass)
    && (!subject || row.subject === subject)
  ));
});

router.get("/teacher-portal/exams", async (req, res): Promise<void> => {
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const teacherId = typeof req.query.teacherId === "string" ? parseInt(req.query.teacherId) : null;
  const rows = await db
    .select({
      id: examResultsTable.id,
      studentId: examResultsTable.studentId,
      studentName: studentsTable.name,
      rollNumber: studentsTable.rollNumber,
      class: examResultsTable.class,
      subject: examResultsTable.subject,
      totalMarks: examResultsTable.totalMarks,
      obtainedMarks: examResultsTable.obtainedMarks,
      percentage: examResultsTable.percentage,
      grade: examResultsTable.grade,
      status: examResultsTable.status,
      position: examResultsTable.position,
      checkedPaperUrl: examResultsTable.checkedPaperUrl,
      paperId: examResultsTable.paperId,
      paperTeacherId: examPapersTable.teacherId,
      paperTitle: examPapersTable.title,
      paperUrl: examResultsTable.checkedPaperUrl,
      examType: examPapersTable.examType,
      chapterFrom: examPapersTable.chapterFrom,
      chapterTo: examPapersTable.chapterTo,
      lessonScope: examPapersTable.lessonScope,
    })
    .from(examResultsTable)
    .innerJoin(studentsTable, eq(examResultsTable.studentId, studentsTable.id))
    .leftJoin(examPapersTable, eq(examResultsTable.paperId, examPapersTable.id))
    .orderBy(examResultsTable.class, examResultsTable.subject, examResultsTable.position);
  res.json(rows.filter((row) =>
    (!studentClass || row.class === studentClass)
    && (!teacherId || row.paperTeacherId === teacherId)
  ));
});

router.post("/teacher-portal/exam-results", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const studentId = typeof body.studentId === "number" ? body.studentId : parseInt(String(body.studentId ?? ""));
  const paperId = body.paperId ? parseInt(String(body.paperId)) : null;
  const subject = typeof body.subject === "string" ? body.subject : "";
  const studentClass = typeof body.class === "string" ? body.class : "";
  let totalMarks = parseInt(String(body.totalMarks ?? "0")) || 0;
  const obtainedMarks = parseInt(String(body.obtainedMarks ?? "0")) || 0;
  const checkedPaperUrl = typeof body.checkedPaperUrl === "string" ? body.checkedPaperUrl : "";
  if (paperId && totalMarks === 0) {
    const [paper] = await db.select().from(examPapersTable).where(eq(examPapersTable.id, paperId));
    totalMarks = paper?.totalMarks ?? 0;
  }
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : percentage >= 50 ? "D" : "F";
  const status = percentage >= 50 ? "Pass" : "Fail";
  const position = body.position ? parseInt(String(body.position)) : null;
  if (!studentId || !subject || !studentClass || !totalMarks) {
    res.status(400).json({ error: "Student, class, subject and marks are required" });
    return;
  }
  const [row] = await db.insert(examResultsTable).values({
    studentId,
    paperId,
    subject,
    class: studentClass,
    totalMarks,
    obtainedMarks,
    percentage,
    grade,
    status,
    position,
    checkedPaperUrl,
  }).returning();
  const related = await db.select().from(examResultsTable).where(
    and(
      eq(examResultsTable.class, studentClass),
      eq(examResultsTable.subject, subject),
      paperId ? eq(examResultsTable.paperId, paperId) : isNull(examResultsTable.paperId)
    )
  );
  const ranked = related.slice().sort((a, b) => b.obtainedMarks - a.obtainedMarks);
  for (const [index, result] of ranked.entries()) {
    await db.update(examResultsTable).set({ position: index + 1 }).where(eq(examResultsTable.id, result.id));
  }
  res.status(201).json(row);
});

router.get("/academic/teacher-for-subject", async (req, res): Promise<void> => {
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const subject = typeof req.query.subject === "string" ? req.query.subject : "";
  const teachers = await db.select().from(teachersTable).where(eq(teachersTable.isActive, true));
  const teacher = teachers.find((t) => {
    if (!t.teachingAssignments) return false;
    try {
      const assignments = JSON.parse(t.teachingAssignments) as Array<{ class: string; subject: string }>;
      return assignments.some((a) => a.class === studentClass && a.subject === subject);
    } catch {
      return t.teachingAssignments.toLowerCase().includes(studentClass.toLowerCase())
        && t.teachingAssignments.toLowerCase().includes(subject.toLowerCase());
    }
  });
  res.json(teacher ?? null);
});

router.post("/academic/syllabus", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const studentClass = typeof body.class === "string" ? body.class : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const planDate = typeof body.planDate === "string" ? body.planDate : "";
  const chapterName = typeof body.chapterName === "string" ? body.chapterName.trim() : "";
  const lesson = typeof body.lesson === "string" ? body.lesson.trim() : "";
  const contentScope = typeof body.contentScope === "string" ? body.contentScope.trim() : "";
  if (!studentClass || !subject || !planDate || !chapterName || !lesson) {
    res.status(400).json({ error: "Class, subject, date, chapter and lesson are required" });
    return;
  }
  const [row] = await db.insert(syllabusPlansTable).values({
    class: studentClass,
    subject,
    planDate,
    chapterName,
    lesson,
    contentScope,
  }).returning();
  res.status(201).json(row);
});

router.get("/academic/syllabus", async (req, res): Promise<void> => {
  const studentClass = typeof req.query.class === "string" ? req.query.class : "";
  const subject = typeof req.query.subject === "string" ? req.query.subject : "";
  const rows = await db.select().from(syllabusPlansTable).orderBy(syllabusPlansTable.planDate);
  res.json(rows.filter((row) => (!studentClass || row.class === studentClass) && (!subject || row.subject === subject)));
});

export default router;
