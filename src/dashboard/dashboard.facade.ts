import { dashboardService } from "../services/dashboard.service";

export const dashboardFacade = {
  getOverview: () => dashboardService.getOverview(),
  getBlockers: () => dashboardService.getBlockers(),
  getInsights: () => dashboardService.getInsights(),
};
