import { Router, type IRouter } from "express";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { db, studentsTable, feeRecordsTable, attendanceTable, announcementsTable, examResultsTable, examPapersTable } from "@workspace/db";
import {
  CreateStudentBody,
  UpdateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  DeleteStudentParams,
  ListStudentsQueryParams,
  GetChildProgressParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/students/classes", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ class: studentsTable.class })
    .from(studentsTable)
    .where(eq(studentsTable.isActive, true))
    .orderBy(studentsTable.class);
  res.json(rows.map(r => r.class));
});

router.get("/students", async (req, res): Promise<void> => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { class: studentClass, search, whatsapp } = parsed.data;

  let query = db.select().from(studentsTable);
  const conditions = [];

  if (studentClass) {
    conditions.push(eq(studentsTable.class, studentClass));
  }
  if (search) {
    conditions.push(
      or(
        ilike(studentsTable.name, `%${search}%`),
        ilike(studentsTable.rollNumber, `%${search}%`),
        ilike(studentsTable.fatherName, `%${search}%`)
      )
    );
  }
  if (whatsapp === "with") {
    conditions.push(eq(studentsTable.hasWhatsapp, true));
  }
  if (whatsapp === "without") {
    conditions.push(eq(studentsTable.hasWhatsapp, false));
  }

  const students = conditions.length > 0
    ? await db.select().from(studentsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(studentsTable.class, studentsTable.name)
    : await db.select().from(studentsTable).orderBy(studentsTable.class, studentsTable.name);

  res.json(students);
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.insert(studentsTable).values({
    rollNumber: parsed.data.rollNumber,
    name: parsed.data.name,
    class: parsed.data.class,
    section: parsed.data.section ?? null,
    fatherName: parsed.data.fatherName,
    motherName: parsed.data.motherName ?? null,
    phone: parsed.data.fatherPhone ?? parsed.data.phone,
    fatherPhone: parsed.data.fatherPhone ?? parsed.data.phone,
    homePhone: parsed.data.homePhone ?? null,
    whatsappNumber: parsed.data.hasWhatsapp === false ? null : (parsed.data.whatsappNumber ?? null),
    hasWhatsapp: parsed.data.hasWhatsapp ?? true,
    address: parsed.data.address ?? null,
    admissionDate: parsed.data.admissionDate,
    monthlyFee: parsed.data.monthlyFee,
    isActive: true,
  }).returning();

  res.status(201).json(student);
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const feeHistory = await db.select().from(feeRecordsTable)
    .where(eq(feeRecordsTable.studentId, params.data.id))
    .orderBy(feeRecordsTable.year, feeRecordsTable.month);

  const attendanceRecords = await db.select().from(attendanceTable)
    .where(eq(attendanceTable.studentId, params.data.id));

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.present).length;
  const absentDays = totalDays - presentDays;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  res.json({
    ...student,
    feeHistory: feeHistory.map(f => ({ ...f, studentName: student.name, rollNumber: student.rollNumber, class: student.class })),
    attendanceSummary: { totalDays, presentDays, absentDays, percentage },
  });
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof studentsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.class !== undefined) updateData.class = parsed.data.class;
  if (parsed.data.section !== undefined) updateData.section = parsed.data.section ?? null;
  if (parsed.data.fatherName !== undefined) updateData.fatherName = parsed.data.fatherName;
  if (parsed.data.motherName !== undefined) updateData.motherName = parsed.data.motherName ?? null;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.fatherPhone !== undefined) {
    updateData.fatherPhone = parsed.data.fatherPhone;
    updateData.phone = parsed.data.fatherPhone;
  }
  if (parsed.data.homePhone !== undefined) updateData.homePhone = parsed.data.homePhone || null;
  if (parsed.data.whatsappNumber !== undefined) updateData.whatsappNumber = parsed.data.whatsappNumber || null;
  if (parsed.data.hasWhatsapp !== undefined) {
    updateData.hasWhatsapp = parsed.data.hasWhatsapp;
    if (!parsed.data.hasWhatsapp) updateData.whatsappNumber = null;
  }
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address ?? null;
  if (parsed.data.monthlyFee !== undefined) updateData.monthlyFee = parsed.data.monthlyFee;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if ((parsed.data as { leftDate?: string }).leftDate !== undefined) {
    const ld = (parsed.data as { leftDate?: string }).leftDate;
    updateData.leftDate = ld ?? null;
    if (ld) updateData.isActive = false;
  }

  const [student] = await db.update(studentsTable)
    .set(updateData)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(student);
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({ success: true, message: "Student deleted" });
});

router.get("/parents/child-progress/:rollNumber", async (req, res): Promise<void> => {
  const params = GetChildProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable)
    .where(eq(studentsTable.rollNumber, params.data.rollNumber));

  if (!student) {
    res.status(404).json({ error: "Student not found with this roll number" });
    return;
  }

  const allFees = await db.select().from(feeRecordsTable)
    .where(eq(feeRecordsTable.studentId, student.id))
    .orderBy(feeRecordsTable.year, feeRecordsTable.month);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentFee = allFees.find(f => f.month === currentMonth && f.year === currentYear);
  const pendingFees = allFees.filter(f => !f.paid);
  const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0);

  const attendanceRecords = await db.select().from(attendanceTable)
    .where(eq(attendanceTable.studentId, student.id))
    .orderBy(attendanceTable.date);

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.present).length;
  const absentDays = totalDays - presentDays;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const recentAttendance = attendanceRecords.slice(-10).map(a => ({
    ...a,
    studentName: student.name,
    rollNumber: student.rollNumber,
    class: student.class,
  }));

  const announcements = await db.select().from(announcementsTable)
    .orderBy(announcementsTable.createdAt)
    .limit(5);

  const examResults = await db
    .select({
      id: examResultsTable.id,
      subject: examResultsTable.subject,
      class: examResultsTable.class,
      totalMarks: examResultsTable.totalMarks,
      obtainedMarks: examResultsTable.obtainedMarks,
      percentage: examResultsTable.percentage,
      grade: examResultsTable.grade,
      status: examResultsTable.status,
      position: examResultsTable.position,
      paperTitle: examPapersTable.title,
      paperUrl: examResultsTable.checkedPaperUrl,
      createdAt: examResultsTable.createdAt,
    })
    .from(examResultsTable)
    .leftJoin(examPapersTable, eq(examResultsTable.paperId, examPapersTable.id))
    .where(eq(examResultsTable.studentId, student.id))
    .orderBy(examResultsTable.createdAt);

  res.json({
    student,
    attendanceSummary: { totalDays, presentDays, absentDays, percentage },
    feeStatus: {
      currentMonth: currentFee ? { ...currentFee, studentName: student.name, rollNumber: student.rollNumber, class: student.class } : null,
      pendingCount: pendingFees.length,
      totalDue,
    },
    recentAttendance,
    announcements: announcements.filter(a => a.targetRole === "all" || a.targetRole === "parents"),
    examResults,
  });
});

// Public: search students by name/class for parent portal
router.get("/parents/search-students", async (req, res): Promise<void> => {
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  const studentClass = typeof req.query.class === "string" ? req.query.class.trim() : "";

  if (!name && !studentClass) {
    res.json([]);
    return;
  }

  const conditions: ReturnType<typeof eq>[] = [eq(studentsTable.isActive, true)];
  if (name.length >= 2) {
    conditions.push(
      or(
        ilike(studentsTable.name, `%${name}%`),
        ilike(studentsTable.fatherName, `%${name}%`)
      ) as ReturnType<typeof eq>
    );
  }
  if (studentClass) {
    conditions.push(eq(studentsTable.class, studentClass));
  }

  const students = await db.select({
    name: studentsTable.name,
    rollNumber: studentsTable.rollNumber,
    class: studentsTable.class,
    section: studentsTable.section,
    fatherName: studentsTable.fatherName,
  })
    .from(studentsTable)
    .where(and(...conditions))
    .orderBy(studentsTable.name)
    .limit(20);

  res.json(students);
});

// GET /students/:id/attendance?month=6&year=2026
router.get("/students/:id/attendance", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid student id" }); return; }

  const month = req.query.month ? parseInt(req.query.month as string) : undefined;
  const year  = req.query.year  ? parseInt(req.query.year  as string) : undefined;

  // Build where clause — date is a PG date column so use EXTRACT, not LIKE
  let whereClause;
  if (year && month) {
    whereClause = and(
      eq(attendanceTable.studentId, id),
      sql`EXTRACT(YEAR  FROM ${attendanceTable.date}) = ${year}`,
      sql`EXTRACT(MONTH FROM ${attendanceTable.date}) = ${month}`
    );
  } else if (year) {
    whereClause = and(
      eq(attendanceTable.studentId, id),
      sql`EXTRACT(YEAR FROM ${attendanceTable.date}) = ${year}`
    );
  } else {
    whereClause = eq(attendanceTable.studentId, id);
  }

  const records = await db
    .select()
    .from(attendanceTable)
    .where(whereClause)
    .orderBy(attendanceTable.date);

  res.json(records);
});

export default router;
