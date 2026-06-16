import { Router, type IRouter } from "express";
import { credentialsTable, db, teachersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

function validateTeacherBody(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const mobileNumber = typeof body.mobileNumber === "string" ? body.mobileNumber.trim() : phone;
  const homeNumber = typeof body.homeNumber === "string" ? body.homeNumber.trim() : "";
  const whatsappNumber = typeof body.whatsappNumber === "string" ? body.whatsappNumber.trim() : "";
  const qualification = typeof body.qualification === "string" ? body.qualification.trim() : "";
  const joiningDate = typeof body.joiningDate === "string" ? body.joiningDate.trim() : "";
  const monthlySalary = typeof body.monthlySalary === "number"
    ? body.monthlySalary
    : parseInt(String(body.monthlySalary ?? "0")) || 0;
  const subjectsTaught = typeof body.subjectsTaught === "string" ? body.subjectsTaught : "";
  const assignedClass = typeof body.assignedClass === "string" && body.assignedClass ? body.assignedClass : null;
  const teachingAssignments = typeof body.teachingAssignments === "string" ? body.teachingAssignments : "";
  const timetableNotes = typeof body.timetableNotes === "string" ? body.timetableNotes : "";
  const portalUsername = typeof body.portalUsername === "string" ? body.portalUsername.trim().toLowerCase() : "";
  const portalPassword = typeof body.portalPassword === "string" ? body.portalPassword.trim() : "";
  const address = typeof body.address === "string" && body.address ? body.address : null;

  const phonePattern = /^\+92\d{10}$/;
  if (name.length < 2) return { error: "Name must be at least 2 characters" };
  if (!phonePattern.test(mobileNumber)) return { error: "Mobile Number must be like +923700572988" };
  if (homeNumber && !phonePattern.test(homeNumber)) return { error: "Home Number must be like +923700572988" };
  if (whatsappNumber && !phonePattern.test(whatsappNumber)) return { error: "WhatsApp Number must be like +923700572988" };
  if (!joiningDate) return { error: "Joining date is required" };
  if (monthlySalary < 0) return { error: "Salary must be 0 or more" };

  return { data: { name, phone: mobileNumber, mobileNumber, homeNumber: homeNumber || null, whatsappNumber: whatsappNumber || null, qualification, address, joiningDate, monthlySalary, subjectsTaught, assignedClass, teachingAssignments, timetableNotes, portalUsername: portalUsername || null, portalPassword: portalPassword || null } };
}

async function saveTeacherCredential(username: string | null | undefined, password: string | null | undefined) {
  if (!username || !password) return;
  const normalized = username.trim().toLowerCase();
  const [existing] = await db.select().from(credentialsTable).where(eq(credentialsTable.username, normalized));
  if (existing) {
    await db.update(credentialsTable).set({ password, role: "teacher" }).where(eq(credentialsTable.id, existing.id));
  } else {
    await db.insert(credentialsTable).values({ username: normalized, password, role: "teacher" });
  }
}

router.get("/teachers", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const teachers = search
    ? await db.select().from(teachersTable).where(or(
      ilike(teachersTable.name, `%${search}%`),
      ilike(teachersTable.subjectsTaught, `%${search}%`)
    )).orderBy(teachersTable.name)
    : await db.select().from(teachersTable).orderBy(teachersTable.name);
  res.json(teachers);
});

router.get("/teachers/by-username/:username", async (req, res): Promise<void> => {
  const username = req.params.username.trim().toLowerCase();
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.portalUsername, username));
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }
  res.json(teacher);
});

router.post("/teachers", async (req, res): Promise<void> => {
  const result = validateTeacherBody(req.body as Record<string, unknown>);
  if ("error" in result) { res.status(400).json({ error: result.error }); return; }
  const [teacher] = await db.insert(teachersTable).values({ ...result.data, isActive: true }).returning();
  await saveTeacherCredential(result.data.portalUsername, result.data.portalPassword);
  res.status(201).json(teacher);
});

router.patch("/teachers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid teacher id" }); return; }

  const body = req.body as Record<string, unknown>;
  const updateData: Partial<typeof teachersTable.$inferInsert> = {};

  if (typeof body.name === "string") updateData.name = body.name.trim();
  if (typeof body.phone === "string") updateData.phone = body.phone.trim();
  if (typeof body.mobileNumber === "string") {
    updateData.mobileNumber = body.mobileNumber.trim();
    updateData.phone = body.mobileNumber.trim();
  }
  if ("homeNumber" in body) updateData.homeNumber = typeof body.homeNumber === "string" && body.homeNumber ? body.homeNumber.trim() : null;
  if ("whatsappNumber" in body) updateData.whatsappNumber = typeof body.whatsappNumber === "string" && body.whatsappNumber ? body.whatsappNumber.trim() : null;
  if (typeof body.qualification === "string") updateData.qualification = body.qualification.trim();
  if ("address" in body) updateData.address = typeof body.address === "string" && body.address ? body.address : null;
  if (typeof body.monthlySalary !== "undefined") updateData.monthlySalary = parseInt(String(body.monthlySalary)) || 0;
  if (typeof body.subjectsTaught === "string") updateData.subjectsTaught = body.subjectsTaught;
  if ("assignedClass" in body) updateData.assignedClass = typeof body.assignedClass === "string" && body.assignedClass ? body.assignedClass : null;
  if (typeof body.teachingAssignments === "string") updateData.teachingAssignments = body.teachingAssignments;
  if (typeof body.timetableNotes === "string") updateData.timetableNotes = body.timetableNotes;
  if ("portalUsername" in body) updateData.portalUsername = typeof body.portalUsername === "string" && body.portalUsername ? body.portalUsername.trim().toLowerCase() : null;
  if ("portalPassword" in body) updateData.portalPassword = typeof body.portalPassword === "string" && body.portalPassword ? body.portalPassword.trim() : null;
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

  const [teacher] = await db.update(teachersTable).set(updateData).where(eq(teachersTable.id, id)).returning();
  if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
  await saveTeacherCredential(teacher.portalUsername, teacher.portalPassword);
  res.json(teacher);
});

router.delete("/teachers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid teacher id" }); return; }
  const [teacher] = await db.delete(teachersTable).where(eq(teachersTable.id, id)).returning();
  if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
  res.json({ success: true });
});

export default router;
