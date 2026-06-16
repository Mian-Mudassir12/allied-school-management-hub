import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, credentialsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings/credentials", async (_req, res): Promise<void> => {
  const creds = await db
    .select({
      id: credentialsTable.id,
      username: credentialsTable.username,
      role: credentialsTable.role,
      updatedAt: credentialsTable.updatedAt,
    })
    .from(credentialsTable)
    .orderBy(credentialsTable.username);

  res.json(creds.map(c => ({ ...c, updatedAt: c.updatedAt.toISOString() })));
});

router.post("/settings/change-password", async (req, res): Promise<void> => {
  const { username, newPassword, currentPassword, adminUsername } = req.body as {
    username?: string;
    newPassword?: string;
    currentPassword?: string;
    adminUsername?: string;
  };

  if (!username || !newPassword) {
    res.status(400).json({ error: "username and newPassword are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const isSelf = adminUsername?.toLowerCase() === username.toLowerCase();

  if (isSelf) {
    // Changing own password: must verify current password
    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required to change your own password" });
      return;
    }
    const [existing] = await db.select().from(credentialsTable).where(eq(credentialsTable.username, username.toLowerCase()));
    if (!existing || existing.password !== currentPassword) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
  } else {
    // Changing someone else's password: requester must be an admin
    if (!adminUsername) {
      res.status(403).json({ error: "Only admin can change other accounts' passwords" });
      return;
    }
    const [admin] = await db.select().from(credentialsTable).where(eq(credentialsTable.username, adminUsername.toLowerCase()));
    if (!admin || admin.role !== "admin") {
      res.status(403).json({ error: "Only admin can change other accounts' passwords" });
      return;
    }
    // If adminPassword is provided (e.g. from login page reset), verify it
    const { adminPassword } = req.body as { adminPassword?: string };
    if (adminPassword !== undefined && admin.password !== adminPassword) {
      res.status(401).json({ error: "Admin password is incorrect" });
      return;
    }
  }

  const [cred] = await db
    .update(credentialsTable)
    .set({ password: newPassword })
    .where(eq(credentialsTable.username, username.toLowerCase()))
    .returning();

  if (!cred) {
    res.status(404).json({ error: `No account found for username "${username}"` });
    return;
  }

  req.log.info({ username }, "Password changed successfully");
  res.json({ success: true, message: `Password updated for ${username}` });
});

export default router;
