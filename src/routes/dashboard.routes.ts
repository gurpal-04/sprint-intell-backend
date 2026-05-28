import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.get("/overview", dashboardController.getOverview.bind(dashboardController));
router.get("/blockers", dashboardController.getBlockers.bind(dashboardController));
router.get("/insights", dashboardController.getInsights.bind(dashboardController));

export default router;
