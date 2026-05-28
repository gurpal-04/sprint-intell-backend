import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import issuesRoutes from "./issues.routes";
import sprintRoutes from "./sprint.routes";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", authenticate, authorize(["admin", "engineering_manager", "developer"]), dashboardRoutes);
router.use("/issues", authenticate, authorize(["admin", "engineering_manager", "developer"]), issuesRoutes);
router.use("/sprints", authenticate, authorize(["admin", "engineering_manager", "developer"]), sprintRoutes);

export default router;
