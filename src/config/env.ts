import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GROQ_API_KEY: z.string().min(1),
  CORAL_API_KEY: z.string().min(1),
  CORAL_BASE_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
