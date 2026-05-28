import { insightGeneratorService } from "./insight-generator.service";

export class SummarizerService {
  async summarizeSprint(context: unknown): Promise<unknown> {
    return insightGeneratorService.generate("sprint-summary", undefined, context);
  }
}

export const summarizerService = new SummarizerService();
