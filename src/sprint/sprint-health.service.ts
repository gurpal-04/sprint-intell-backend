interface SprintHealthInput {
  staleIssueCount: number;
  blockedIssueCount: number;
  prsWaitingReviewOver48h: number;
  failingCiCount: number;
  missingDocsCount: number;
  blockedDependenciesCount: number;
}

export class SprintHealthService {
  computeHealth(input: SprintHealthInput): { score: number; riskIndicators: string[] } {
    let score = 100;

    score -= input.staleIssueCount * 2;
    score -= input.blockedIssueCount * 4;
    score -= input.prsWaitingReviewOver48h * 3;
    score -= input.failingCiCount * 4;
    score -= input.missingDocsCount * 2;
    score -= input.blockedDependenciesCount * 3;

    const riskIndicators: string[] = [];
    if (input.staleIssueCount > 0) riskIndicators.push("Inactive issues > 3 days");
    if (input.prsWaitingReviewOver48h > 0) riskIndicators.push("PR review bottleneck > 48h");
    if (input.failingCiCount > 0) riskIndicators.push("Failing CI checks");
    if (input.missingDocsCount > 0) riskIndicators.push("Missing documentation");
    if (input.blockedDependenciesCount > 0) riskIndicators.push("Blocked dependencies");

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      riskIndicators,
    };
  }
}

export const sprintHealthService = new SprintHealthService();
