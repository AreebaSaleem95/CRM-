import { z } from "zod";

export const aiTones = ["friendly", "formal", "short"] as const;

export const followUpSchema = z.object({
  tone: z.enum(aiTones).default("friendly"),
});

export type AiTone = (typeof aiTones)[number];