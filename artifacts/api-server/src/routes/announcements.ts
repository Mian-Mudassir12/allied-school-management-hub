import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, announcementsTable } from "@workspace/db";
import {
  CreateAnnouncementBody,
  DeleteAnnouncementParams,
  ListAnnouncementsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/announcements", async (req, res): Promise<void> => {
  const parsed = ListAnnouncementsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const all = await db.select().from(announcementsTable).orderBy(announcementsTable.createdAt);

  const { targetRole } = parsed.data;
  const filtered = targetRole
    ? all.filter(a => a.targetRole === targetRole || a.targetRole === "all")
    : all;

  res.json(filtered.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [announcement] = await db.insert(announcementsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    targetRole: parsed.data.targetRole,
  }).returning();

  res.status(201).json({
    ...announcement,
    createdAt: announcement.createdAt.toISOString(),
  });
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [announcement] = await db.delete(announcementsTable)
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json({ success: true, message: "Announcement deleted" });
});

export default router;
