import { Router, type IRouter } from "express";
import { db, studentsTable, feeRecordsTable, attendanceTable, announcementsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\r\n");
}

function monthName(m: number): string {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[m - 1] ?? String(m);
}

router.get("/export/students", async (_req, res): Promise<void> => {
  const students = await db
    .select()
    .from(studentsTable)
    .orderBy(studentsTable.rollNumber);

  const headers = [
    "Roll Number", "Name", "Class", "Section",
    "Father Name", "Mother Name", "Phone", "Address",
    "Admission Date", "Monthly Fee (Rs)", "Active",
  ];

  const rows = students.map((s) => [
    s.rollNumber,
    s.name,
    s.class,
    s.section ?? "",
    s.fatherName,
    s.motherName ?? "",
    s.phone,
    s.address ?? "",
    s.admissionDate,
    String(s.monthlyFee),
    s.isActive ? "Yes" : "No",
  ]);

  const csv = toCSV(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="students-${date}.csv"`);
  res.send(csv);
});

router.get("/export/fees", async (_req, res): Promise<void> => {
  const fees = await db
    .select({
      rollNumber: studentsTable.rollNumber,
      name: studentsTable.name,
      class: studentsTable.class,
      month: feeRecordsTable.month,
      year: feeRecordsTable.year,
      amount: feeRecordsTable.amount,
      paid: feeRecordsTable.paid,
      paidDate: feeRecordsTable.paidDate,
    })
    .from(feeRecordsTable)
    .innerJoin(studentsTable, eq(feeRecordsTable.studentId, studentsTable.id))
    .orderBy(studentsTable.rollNumber, feeRecordsTable.year, feeRecordsTable.month);

  const headers = [
    "Roll Number", "Student Name", "Class",
    "Month", "Year", "Amount (Rs)", "Paid", "Paid Date",
  ];

  const rows = fees.map((f) => [
    f.rollNumber,
    f.name,
    f.class,
    monthName(f.month),
    String(f.year),
    String(f.amount),
    f.paid ? "Paid" : "Unpaid",
    f.paidDate ?? "",
  ]);

  const csv = toCSV(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="fees-${date}.csv"`);
  res.send(csv);
});

router.get("/export/attendance", async (_req, res): Promise<void> => {
  const records = await db
    .select({
      rollNumber: studentsTable.rollNumber,
      name: studentsTable.name,
      class: studentsTable.class,
      date: attendanceTable.date,
      present: attendanceTable.present,
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .orderBy(attendanceTable.date, studentsTable.rollNumber);

  const headers = ["Roll Number", "Student Name", "Class", "Date", "Status"];

  const rows = records.map((r) => [
    r.rollNumber,
    r.name,
    r.class,
    r.date,
    r.present ? "Present" : "Absent",
  ]);

  const csv = toCSV(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-${date}.csv"`);
  res.send(csv);
});

router.get("/backup", async (_req, res): Promise<void> => {
  const [students, fees, attendance] = await Promise.all([
    db.select().from(studentsTable).orderBy(studentsTable.id),
    db.select().from(feeRecordsTable).orderBy(feeRecordsTable.id),
    db.select().from(attendanceTable).orderBy(attendanceTable.id),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="allied-school-backup-${date}.json"`);
  res.json({ version: 1, exportedAt: new Date().toISOString(), students, fees, attendance });
});

router.post("/restore", async (req, res): Promise<void> => {
  const body = req.body as { version?: number; students?: unknown[]; fees?: unknown[]; attendance?: unknown[] };

  if (!Array.isArray(body.students)) {
    res.status(400).json({ error: "Invalid backup file: missing students array" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE attendance, fee_records, students RESTART IDENTITY CASCADE`);

    if (body.students && body.students.length > 0) {
      const rows = (body.students as Record<string, unknown>[]).map((s) => ({
        rollNumber: String(s.rollNumber ?? s.roll_number ?? ""),
        name: String(s.name ?? ""),
        class: String(s.class ?? ""),
        section: s.section ? String(s.section) : null,
        fatherName: String(s.fatherName ?? s.father_name ?? ""),
        motherName: s.motherName || s.mother_name ? String(s.motherName ?? s.mother_name) : null,
        phone: String(s.phone ?? ""),
        address: s.address ? String(s.address) : null,
        admissionDate: String(s.admissionDate ?? s.admission_date ?? new Date().toISOString().slice(0, 10)),
        monthlyFee: Number(s.monthlyFee ?? s.monthly_fee ?? 0),
        isActive: s.isActive !== undefined ? Boolean(s.isActive) : s.is_active !== undefined ? Boolean(s.is_active) : true,
        leftDate: s.leftDate || s.left_date ? String(s.leftDate ?? s.left_date) : null,
      }));
      await tx.insert(studentsTable).values(rows);
    }

    if (body.fees && body.fees.length > 0) {
      const allStudents = await tx.select({ id: studentsTable.id, rollNumber: studentsTable.rollNumber }).from(studentsTable);
      const rollToId = new Map(allStudents.map((s) => [s.rollNumber, s.id]));
      const origStudents = (body.students ?? []) as Record<string, unknown>[];
      const origIdToRoll = new Map(origStudents.map((s) => [Number(s.id), String(s.rollNumber ?? s.roll_number)]));

      const feeRows = (body.fees as Record<string, unknown>[]).flatMap((f) => {
        const origId = Number(f.studentId ?? f.student_id);
        const roll = origIdToRoll.get(origId);
        const newId = roll ? rollToId.get(roll) : undefined;
        if (!newId) return [];
        return [{
          studentId: newId,
          month: Number(f.month),
          year: Number(f.year),
          amount: Number(f.amount),
          paid: Boolean(f.paid),
          paidDate: f.paidDate || f.paid_date ? String(f.paidDate ?? f.paid_date) : null,
        }];
      });
      if (feeRows.length > 0) await tx.insert(feeRecordsTable).values(feeRows);
    }

    if (body.attendance && body.attendance.length > 0) {
      const allStudents = await tx.select({ id: studentsTable.id, rollNumber: studentsTable.rollNumber }).from(studentsTable);
      const rollToId = new Map(allStudents.map((s) => [s.rollNumber, s.id]));
      const origStudents = (body.students ?? []) as Record<string, unknown>[];
      const origIdToRoll = new Map(origStudents.map((s) => [Number(s.id), String(s.rollNumber ?? s.roll_number)]));

      const attRows = (body.attendance as Record<string, unknown>[]).flatMap((a) => {
        const origId = Number(a.studentId ?? a.student_id);
        const roll = origIdToRoll.get(origId);
        const newId = roll ? rollToId.get(roll) : undefined;
        if (!newId) return [];
        return [{
          studentId: newId,
          date: String(a.date),
          present: Boolean(a.present),
        }];
      });
      if (attRows.length > 0) await tx.insert(attendanceTable).values(attRows);
    }
  });

  const counts = {
    students: body.students?.length ?? 0,
    fees: body.fees?.length ?? 0,
    attendance: body.attendance?.length ?? 0,
  };
  req.log.info(counts, "Data restored from backup");
  res.json({
    success: true,
    message: `Restored ${counts.students} students, ${counts.fees} fee records, and ${counts.attendance} attendance records.`,
  });
});

router.post("/factory-reset", async (req, res): Promise<void> => {
  const { confirmText } = req.body as { confirmText?: string };
  if (confirmText !== "RESET") {
    res.status(400).json({ error: "Confirmation text does not match. Send confirmText: 'RESET'" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE attendance, fee_records, announcements, students RESTART IDENTITY CASCADE`);
  });

  req.log.info("Factory reset performed — all student data cleared");
  res.json({ success: true, message: "All school data has been reset. Credentials are unchanged." });
});

export default router;
