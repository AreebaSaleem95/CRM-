export interface GenerateOptions {
  system?: string;
  prompt: string;
}

export interface LLMProvider {
  readonly name: string;
  generate(options: GenerateOptions): Promise<string>;
}