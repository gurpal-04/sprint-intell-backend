export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface DashboardOverviewResponse {
  totalIssues: number;
  completed: number;
  inProgress: number;
  blocked: number;
  inReview: number;
  staleIssues: number;
  sprintHealthScore: number;
}

export interface UnifiedIssueContextResponse {
  issue: unknown;
  pullRequests: unknown[];
  slackThreads: unknown[];
  confluenceDocs: unknown[];
  ciStatus: unknown;
  aiInsights: unknown;
  blockers: string[];
  recommendations: string[];
}
