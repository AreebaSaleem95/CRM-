import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { AntigravityProvider } from "./antigravityProvider";
import { GeminiProvider } from "./geminiProvider";
import { LLMProvider } from "./LLMProvider";

let provider: LLMProvider | null = null;

// Naya provider jodna ho to yahan ek aur "if" aur ek nayi class file
export function getLLMProvider(): LLMProvider {
  if (provider) return provider;

  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, "AI is not configured on the server (set GEMINI_API_KEY in the .env file)");
  }

  if (env.AI_PROVIDER === "antigravity") {
    provider = new AntigravityProvider({
      apiKey: env.GEMINI_API_KEY,
      agent: env.ANTIGRAVITY_AGENT,
      model: env.ANTIGRAVITY_MODEL || undefined,
      maxTotalTokens: env.ANTIGRAVITY_MAX_TOKENS,
    });
    return provider;
  }

  if (env.AI_PROVIDER === "gemini") {
    if (!env.GEMINI_MODEL) {
      throw new ApiError(503, "AI is not configured on the server (set GEMINI_MODEL in the .env file)");
    }
    provider = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    return provider;
  }

  throw new ApiError(503, `Unknown AI provider: ${env.AI_PROVIDER}`);
}