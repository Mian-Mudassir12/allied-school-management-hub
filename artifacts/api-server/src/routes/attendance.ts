import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, studentsTable } from "@workspace/db";
import {
  MarkAttendanceBody,
  UpdateAttendanceBody,
  UpdateAttendanceParams,
  ListAttendanceQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const parsed = ListAttendanceQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { class: studentClass, date, studentId } = parsed.data;

  // Build student filter conditions — always start from students table
  const conditions: ReturnType<typeof eq>[] = [eq(studentsTable.isActive, true)];
  if (studentClass) conditions.push(eq(studentsTable.class, studentClass));
  if (studentId) conditions.push(eq(studentsTable.id, studentId));

  const students = await db
    .select()
    .from(studentsTable)
    .where(and(...conditions))
    .orderBy(studentsTable.rollNumber);

  if (students.length === 0) {
    res.json([]);
    return;
  }

  // Fetch attendance records for this date separately (if date given)
  let attendanceMap = new Map<number, { id: number; present: boolean; date: string }>();
  if (date) {
    const records = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.date, date));
    attendanceMap = new Map(records.map(r => [r.studentId, { id: r.id, present: r.present, date: r.date }]));
  }

  // Merge: every student gets a row; unrecorded students get id=null, present=false
  const results = students.map(student => {
    const record = attendanceMap.get(student.id);
    return {
      id: record?.id ?? null,
      studentId: student.id,
      date: date ?? null,
      present: record?.present ?? false,
      studentName: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
    };
  });

  res.json(results);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(attendanceTable).where(
    and(
      eq(attendanceTable.studentId, parsed.data.studentId),
      eq(attendanceTable.date, parsed.data.date)
    )
  );

  if (existing.length > 0) {
    const [updated] = await db.update(attendanceTable)
      .set({ present: parsed.data.present })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();

    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, updated.studentId));
    res.status(201).json({
      ...updated,
      studentName: student?.name ?? null,
      rollNumber: student?.rollNumber ?? null,
      class: student?.class ?? null,
    });
    return;
  }

  const [record] = await db.insert(attendanceTable).values({
    studentId: parsed.data.studentId,
    date: parsed.data.date,
    present: parsed.data.present,
  }).returning();

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId));

  res.status(201).json({
    ...record,
    studentName: student?.name ?? null,
    rollNumber: student?.rollNumber ?? null,
    class: student?.class ?? null,
  });
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const params = UpdateAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.update(attendanceTable)
    .set({ present: parsed.data.present })
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId));

  res.json({
    ...record,
    studentName: student?.name ?? null,
    rollNumber: student?.rollNumber ?? null,
    class: student?.class ?? null,
  });
});

export default router;
