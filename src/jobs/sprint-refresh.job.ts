import cron from "node-cron";
import { dashboardService } from "../services/dashboard.service";
import { logger } from "../config/logger";

export const startSprintRefreshJob = (): void => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await dashboardService.getOverview();
      await dashboardService.getInsights();
      logger.info("Sprint refresh job completed");
    } catch (error) {
      logger.error({ error }, "Sprint refresh job failed");
    }
  });
};
