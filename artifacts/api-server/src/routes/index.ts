import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import dashboardRouter from "./dashboard";
import campaignsRouter from "./campaigns";
import linksRouter from "./links";
import webhooksRouter from "./webhooks";
import eventsRouter from "./events";
import conversionsRouter from "./conversions";
import doctorRouter from "./doctor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspacesRouter);
router.use(dashboardRouter);
router.use(campaignsRouter);
router.use(linksRouter);
router.use(webhooksRouter);
router.use(eventsRouter);
router.use(conversionsRouter);
router.use("/doctor", doctorRouter);

export default router;
