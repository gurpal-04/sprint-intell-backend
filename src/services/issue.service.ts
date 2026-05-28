import { coralQueryService } from "../coral/coral-query.service";
import { sprintAnalysisService } from "../ai/sprint-analysis.service";
import { UnifiedIssueContextResponse } from "../types/api.types";

export class IssueService {
  async getIssueContext(issueId: string): Promise<UnifiedIssueContextResponse> {
    const [issueContextRows, slackThreads, docs] = await Promise.all([
      coralQueryService.getIssueFullContext(issueId),
      coralQueryService.getIssueSlackThreads(issueId),
      coralQueryService.getIssueDocs(issueId),
    ]);

    const issue = issueContextRows[0] ?? null;
    const pullRequests = issueContextRows
      .filter((row) => row.pr_number)
      .map((row) => ({ number: row.pr_number, state: row.pr_state }));

    const context = {
      issue,
      pullRequests,
      slackThreads,
      confluenceDocs: docs,
      ciStatus: { status: "unknown" },
    };

    const aiInsights = await sprintAnalysisService.analyzeIssue(issueId, context);

    return {
      issue,
      pullRequests,
      slackThreads,
      confluenceDocs: docs,
      ciStatus: { status: "unknown" },
      aiInsights,
      blockers: ((aiInsights as { blockers?: string[] }).blockers ?? []) as string[],
      recommendations: ((aiInsights as { recommendations?: string[] }).recommendations ?? []) as string[],
    };
  }

  async getStaleIssues(): Promise<Record<string, unknown>[]> {
    return coralQueryService.getStaleIssues();
  }
}

export const issueService = new IssueService();
