import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError";
import { GenerateOptions, LLMProvider } from "./LLMProvider";

// Antigravity agent abhi preview mein hai, isliye SDK ke types purane ho sakte hain.
// Yahan sirf wahi hissa type kiya hai jo hum istemal karte hain.
type InteractionResult = {
  status?: string;
  output_text?: string;
  usage?: { total_tokens?: number };
};
type InteractionsApi = {
  interactions: {
    create(
      params: Record<string, unknown>,
      options?: { timeout?: number }
    ): Promise<InteractionResult>;
  };
};

export interface AntigravityConfig {
  apiKey: string;
  agent: string;
  model?: string;
  maxTotalTokens: string;
}

export class AntigravityProvider implements LLMProvider {
  readonly name = "antigravity";
  private client: InteractionsApi;

  constructor(private config: AntigravityConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey }) as unknown as InteractionsApi;
  }

  async generate({ system, prompt }: GenerateOptions): Promise<string> {
    const instructions = [
      system,
      "You are used here only as a text writer. Do not run code, do not browse the web and do not create files. Reply directly with the final text only.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const agentConfig: Record<string, unknown> = {
      type: "antigravity",
      max_total_tokens: this.config.maxTotalTokens, // is hadd par agent ruk jata hai (kharch ki hifazat)
    };
    if (this.config.model) agentConfig.model = this.config.model;

    const interaction = await this.client.interactions.create(
      {
        agent: this.config.agent,
        input: `${instructions}\n\n${prompt}`,
        environment: "remote",
        agent_config: agentConfig,
      },
      { timeout: 120000 }
    );

    console.log(`[ai] antigravity tokens used: ${interaction.usage?.total_tokens ?? "unknown"}`);

    const text = (interaction.output_text ?? "").trim();

    if (!text && interaction.status === "incomplete") {
      throw new ApiError(
        502,
        "The AI agent stopped before finishing (token limit reached). Increase ANTIGRAVITY_MAX_TOKENS in the server .env file."
      );
    }
    return text;
  }
}