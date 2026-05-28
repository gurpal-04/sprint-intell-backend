import { coralQueryService } from "../coral/coral-query.service";

export class SprintService {
  async getCurrentSprint(): Promise<{ issues: Record<string, unknown>[] }> {
    const issues = await coralQueryService.getCurrentSprintIssues();
    return { issues };
  }
}

export const sprintService = new SprintService();
