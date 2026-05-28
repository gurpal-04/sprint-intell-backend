import { insightGeneratorService } from "./insight-generator.service";

export class SprintAnalysisService {
  async analyzeIssue(issueId: string, context: unknown): Promise<unknown> {
    return insightGeneratorService.generate("issue-analysis", issueId, context);
  }

  async analyzeSprint(context: unknown): Promise<unknown> {
    return insightGeneratorService.generate("sprint-analysis", undefined, context);
  }
}

export const sprintAnalysisService = new SprintAnalysisService();
