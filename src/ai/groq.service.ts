import OpenAI from "openai";
import { env } from "../config/env";

export class GroqService {
  private readonly client: OpenAI;
  private readonly model = "llama-3.3-70b-versatile";

  constructor() {
    this.client = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async completeJson(prompt: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an engineering operations analyst. Always return JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return JSON.parse(response.choices[0]?.message?.content ?? "{}");
  }
}

export const groqService = new GroqService();
