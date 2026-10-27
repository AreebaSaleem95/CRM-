import { GoogleGenAI } from "@google/genai";
import { GenerateOptions, LLMProvider } from "./LLMProvider";

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private client: GoogleGenAI;

  constructor(apiKey: string, private model: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate({ system, prompt }: GenerateOptions): Promise<string> {
    const contents = system ? `${system}\n\n${prompt}` : prompt;
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
    });

    console.log(`[ai] gemini tokens used: ${response.usageMetadata?.totalTokenCount ?? "unknown"}`);

    return (response.text ?? "").trim();
  }
}