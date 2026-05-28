import { prisma } from "../config/prisma";
import { sprintInsightPrompt } from "../prompts/sprint.prompts";
import { groqService } from "./groq.service";

export class InsightGeneratorService {
  async generate(scope: string, referenceId: string | undefined, context: unknown): Promise<unknown> {
    const prompt = sprintInsightPrompt(context);
    const response = await groqService.completeJson(prompt);

    await prisma.aIInsight.create({
      data: {
        scope,
        referenceId,
        model: "llama-3.3-70b-versatile",
        prompt,
        response: response as object,
      },
    });

    return response;
  }
}

export const insightGeneratorService = new InsightGeneratorService();
