import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studentsTable, feeRecordsTable, attendanceTable, announcementsTable } from "@workspace/db";

const router: IRouter = Router();

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const { month, year } = getCurrentMonthYear();
  const today = getTodayString();

  const allStudents = await db.select().from(studentsTable);
  const activeStudents = allStudents.filter(s => s.isActive);

  const monthFees = await db.select().from(feeRecordsTable).where(
    and(eq(feeRecordsTable.month, month), eq(feeRecordsTable.year, year))
  );

  const expected = monthFees.reduce((sum, f) => sum + f.amount, 0);
  const collected = monthFees.filter(f => f.paid).reduce((sum, f) => sum + f.amount, 0);
  const pending = expected - collected;

  const todayAttendance = await db.select().from(attendanceTable).where(eq(attendanceTable.date, today));
  const presentToday = todayAttendance.filter(a => a.present).length;
  const absentToday = todayAttendance.filter(a => !a.present).length;

  const announcements = await db.select().from(announcementsTable);

  res.json({
    totalStudents: allStudents.length,
    activeStudents: activeStudents.length,
    currentMonthFeeExpected: expected,
    currentMonthFeeCollected: collected,
    currentMonthFeePending: pending,
    todayAttendancePresent: presentToday,
    todayAttendanceAbsent: absentToday,
    totalAnnouncements: announcements.length,
  });
});

router.get("/dashboard/daily-collection", async (req, res): Promise<void> => {
  const date = (req.query.date as string) || getTodayString();

  const payments = await db
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
    .where(and(eq(feeRecordsTable.paid, true), eq(feeRecordsTable.paidDate, date)));

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    date,
    totalCollected,
    paymentCount: payments.length,
    payments,
  });
});

router.get("/dashboard/class-summary", async (_req, res): Promise<void> => {
  const { month, year } = getCurrentMonthYear();

  const students = await db.select().from(studentsTable).where(eq(studentsTable.isActive, true));
  const fees = await db.select().from(feeRecordsTable).where(
    and(eq(feeRecordsTable.month, month), eq(feeRecordsTable.year, year))
  );

  const CLASS_ORDER = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Matric"];

  const classMap = new Map<string, { totalStudents: number; feesPaid: number; feesPending: number; totalFeeExpected: number; totalFeeCollected: number }>();

  for (const student of students) {
    if (!classMap.has(student.class)) {
      classMap.set(student.class, { totalStudents: 0, feesPaid: 0, feesPending: 0, totalFeeExpected: 0, totalFeeCollected: 0 });
    }
    const entry = classMap.get(student.class)!;
    entry.totalStudents++;

    const studentFee = fees.find(f => f.studentId === student.id);
    if (studentFee) {
      entry.totalFeeExpected += studentFee.amount;
      if (studentFee.paid) {
        entry.feesPaid++;
        entry.totalFeeCollected += studentFee.amount;
      } else {
        entry.feesPending++;
      }
    }
  }

  const summary = CLASS_ORDER
    .filter(c => classMap.has(c))
    .map(c => ({ class: c, ...classMap.get(c)! }));

  const others = Array.from(classMap.entries())
    .filter(([c]) => !CLASS_ORDER.includes(c))
    .map(([c, data]) => ({ class: c, ...data }));

  res.json([...summary, ...others]);
});

export default router;
