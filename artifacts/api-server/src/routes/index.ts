import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import feesRouter from "./fees";
import attendanceRouter from "./attendance";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import exportRouter from "./export";
import teachersRouter from "./teachers";
import academicRouter from "./academic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(feesRouter);
router.use(attendanceRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(exportRouter);
router.use(teachersRouter);
router.use(academicRouter);

export default router;
