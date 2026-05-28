import { coralQueryService } from "../coral/coral-query.service";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { summarizerService } from "../ai/summarizer.service";
import { sprintHealthService } from "../sprint/sprint-health.service";
import { DashboardOverviewResponse } from "../types/api.types";

export class DashboardService {
  async getOverview(): Promise<DashboardOverviewResponse> {
    const [issues, blocked, inReview, stale] = await Promise.all([
      coralQueryService.getCurrentSprintIssues(),
      coralQueryService.getBlockedIssues(),
      coralQueryService.getIssuesInReview(),
      coralQueryService.getStaleIssues(),
    ]);

    const completed = issues.filter((i) => i.status === "done").length;
    const inProgress = issues.filter((i) => i.status === "in_progress").length;

    const health = sprintHealthService.computeHealth({
      staleIssueCount: stale.length,
      blockedIssueCount: blocked.length,
      prsWaitingReviewOver48h: inReview.length,
      failingCiCount: 0,
      missingDocsCount: 0,
      blockedDependenciesCount: blocked.length,
    });

    const overview: DashboardOverviewResponse = {
      totalIssues: issues.length,
      completed,
      inProgress,
      blocked: blocked.length,
      inReview: inReview.length,
      staleIssues: stale.length,
      sprintHealthScore: health.score,
    };

    await prisma.dashboardSnapshot.create({
      data: {
        totalIssues: overview.totalIssues,
        completed: overview.completed,
        inProgress: overview.inProgress,
        blocked: overview.blocked,
        inReview: overview.inReview,
        staleIssues: overview.staleIssues,
        sprintHealthScore: overview.sprintHealthScore,
        payload: overview as unknown as Prisma.InputJsonValue,
      },
    });

    return overview;
  }

  async getBlockers(): Promise<Record<string, unknown>[]> {
    return coralQueryService.getBlockedIssues();
  }

  async getInsights(): Promise<unknown> {
    const issues = await coralQueryService.getCurrentSprintIssues();
    return summarizerService.summarizeSprint({ issues });
  }
}

export const dashboardService = new DashboardService();
