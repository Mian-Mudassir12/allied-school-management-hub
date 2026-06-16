import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, feeRecordsTable, studentsTable } from "@workspace/db";
import {
  CreateFeeRecordBody,
  UpdateFeeRecordBody,
  UpdateFeeRecordParams,
  ListFeesQueryParams,
  GenerateMonthlyFeesBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fees/pending", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: feeRecordsTable.id,
      studentId: feeRecordsTable.studentId,
      month: feeRecordsTable.month,
      year: feeRecordsTable.year,
      amount: feeRecordsTable.amount,
      paid: feeRecordsTable.paid,
      paidDate: feeRecordsTable.paidDate,
      studentName: studentsTable.name,
      rollNumber: studentsTable.rollNumber,
      class: studentsTable.class,
      section: studentsTable.section,
    })
    .from(feeRecordsTable)
    .innerJoin(studentsTable, eq(feeRecordsTable.studentId, studentsTable.id))
    .where(and(eq(feeRecordsTable.paid, false), eq(studentsTable.isActive, true)))
    .orderBy(studentsTable.class, studentsTable.name, feeRecordsTable.year, feeRecordsTable.month);

  res.json(rows);
});

router.get("/fees", async (req, res): Promise<void> => {
  const parsed = ListFeesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { class: studentClass, month, year, studentId } = parsed.data;

  const rows = await db
    .select({
      id: feeRecordsTable.id,
      studentId: feeRecordsTable.studentId,
      month: feeRecordsTable.month,
      year: feeRecordsTable.year,
      amount: feeRecordsTable.amount,
      paid: feeRecordsTable.paid,
      paidDate: feeRecordsTable.paidDate,
      studentName: studentsTable.name,
      rollNumber: studentsTable.rollNumber,
      class: studentsTable.class,
    })
    .from(feeRecordsTable)
    .innerJoin(studentsTable, eq(feeRecordsTable.studentId, studentsTable.id))
    .orderBy(studentsTable.class, studentsTable.name);

  let results = rows;

  if (studentClass) {
    results = results.filter(r => r.class === studentClass);
  }
  if (month) {
    results = results.filter(r => r.month === month);
  }
  if (year) {
    results = results.filter(r => r.year === year);
  }
  if (studentId) {
    results = results.filter(r => r.studentId === studentId);
  }

  res.json(results);
});

router.post("/fees", async (req, res): Promise<void> => {
  const parsed = CreateFeeRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fee] = await db.insert(feeRecordsTable).values({
    studentId: parsed.data.studentId,
    month: parsed.data.month,
    year: parsed.data.year,
    amount: parsed.data.amount,
    paid: false,
  }).returning();

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, fee.studentId));

  res.status(201).json({
    ...fee,
    studentName: student?.name ?? null,
    rollNumber: student?.rollNumber ?? null,
    class: student?.class ?? null,
  });
});

router.patch("/fees/:id", async (req, res): Promise<void> => {
  const params = UpdateFeeRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFeeRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof feeRecordsTable.$inferInsert> = {};
  if (parsed.data.paid !== undefined) updateData.paid = parsed.data.paid;
  if (parsed.data.paidDate !== undefined) updateData.paidDate = parsed.data.paidDate ?? null;

  if (parsed.data.paid && !parsed.data.paidDate) {
    updateData.paidDate = new Date().toISOString().split("T")[0];
  }
  if (parsed.data.paid === false) {
    updateData.paidDate = null;
  }

  const [fee] = await db.update(feeRecordsTable)
    .set(updateData)
    .where(eq(feeRecordsTable.id, params.data.id))
    .returning();

  if (!fee) {
    res.status(404).json({ error: "Fee record not found" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, fee.studentId));

  res.json({
    ...fee,
    studentName: student?.name ?? null,
    rollNumber: student?.rollNumber ?? null,
    class: student?.class ?? null,
  });
});

router.post("/fees/generate-monthly", async (req, res): Promise<void> => {
  const parsed = GenerateMonthlyFeesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, year } = parsed.data;

  const students = await db.select().from(studentsTable).where(eq(studentsTable.isActive, true));

  let created = 0;
  for (const student of students) {
    const existing = await db.select().from(feeRecordsTable).where(
      and(
        eq(feeRecordsTable.studentId, student.id),
        eq(feeRecordsTable.month, month),
        eq(feeRecordsTable.year, year)
      )
    );

    if (existing.length === 0) {
      await db.insert(feeRecordsTable).values({
        studentId: student.id,
        month,
        year,
        amount: student.monthlyFee,
        paid: false,
      });
      created++;
    }
  }

  res.json({ success: true, message: `Generated ${created} fee records for ${month}/${year}` });
});

export default router;
