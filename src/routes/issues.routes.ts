import { Router } from "express";
import { z } from "zod";
import { issueController } from "../controllers/issue.controller";
import { validate } from "../middleware/validation.middleware";

const router = Router();

const contextSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.any().optional(),
  query: z.any().optional(),
});

router.get("/:id/context", validate(contextSchema), issueController.getIssueContext.bind(issueController));
router.get("/stale", issueController.getStaleIssues.bind(issueController));

export default router;
