import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(7),
  CLIENT_URL: z.string().default("http://localhost:5173"),

  // Cloudinary (khali ho to upload "not configured" ka message dega, server phir bhi chalega)
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),

  // AI: "antigravity" ya "gemini". Khali key par AI feature "not configured" ka message dega.
  AI_PROVIDER: z.string().default("antigravity"),
  GEMINI_API_KEY: z.string().default(""),
  // Sirf AI_PROVIDER=gemini ke liye
  GEMINI_MODEL: z.string().default(""),
  // Sirf AI_PROVIDER=antigravity ke liye (preview, ID badal sakti hai)
  ANTIGRAVITY_AGENT: z.string().default("antigravity-preview-09-2026"),
  ANTIGRAVITY_MODEL: z.string().default(""),
  ANTIGRAVITY_MAX_TOKENS: z.string().default("50000"),

  // n8n webhooks (Step 4A ke liye, abhi optional)
  N8N_WEBHOOK_URL: z.string().default(""),
  WEBHOOK_SECRET: z.string().default(""),
  WEBHOOK_DEFAULT_OWNER_EMAIL: z.string().default("admin@crm.com"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;