import { Router } from "express";
import { sprintController } from "../controllers/sprint.controller";

const router = Router();

router.get("/current", sprintController.getCurrentSprint.bind(sprintController));

export default router;
