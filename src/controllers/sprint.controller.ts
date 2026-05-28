import { Request, Response } from "express";
import { sprintService } from "../services/sprint.service";

export class SprintController {
  async getCurrentSprint(_req: Request, res: Response): Promise<void> {
    const data = await sprintService.getCurrentSprint();
    res.json(data);
  }
}

export const sprintController = new SprintController();
