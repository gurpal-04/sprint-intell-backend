import { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";

export class DashboardController {
  async getOverview(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.getOverview();
    res.json(data);
  }

  async getBlockers(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.getBlockers();
    res.json({ data });
  }

  async getInsights(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.getInsights();
    res.json(data);
  }
}

export const dashboardController = new DashboardController();
