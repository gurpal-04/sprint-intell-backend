import { Request, Response } from "express";
import { issueService } from "../services/issue.service";

export class IssueController {
  async getIssueContext(req: Request, res: Response): Promise<void> {
    const data = await issueService.getIssueContext(req.params.id);
    res.json(data);
  }

  async getStaleIssues(_req: Request, res: Response): Promise<void> {
    const data = await issueService.getStaleIssues();
    res.json({ data });
  }
}

export const issueController = new IssueController();
