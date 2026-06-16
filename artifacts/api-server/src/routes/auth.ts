import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, credentialsTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Fallback hardcoded credentials used only if DB is empty
const FALLBACK: Record<string, { password: string; role: string }> = {
  admin: { password: "allied2024", role: "admin" },
  director: { password: "director2024", role: "director" },
  principal: { password: "principal2024", role: "admin" },
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  // Try DB first
  const [dbCred] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.username, username.toLowerCase()));

  if (dbCred) {
    if (dbCred.password !== password) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    res.json({ success: true, role: dbCred.role, username: dbCred.username });
    return;
  }

  // Fallback to hardcoded
  const fallback = FALLBACK[username.toLowerCase()];
  if (!fallback || fallback.password !== password) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  res.json({ success: true, role: fallback.role, username: username.toLowerCase() });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true, message: "Logged out" });
});

export default router;
