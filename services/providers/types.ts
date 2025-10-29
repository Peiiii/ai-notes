export type ModelTier = 'lite' | 'fast' | 'pro';

export interface GenerateTextParams {
  model: ModelTier;
  prompt: string;
  systemInstruction?: string;
  // Future generic params like temperature, topK, etc. can be added here
}

export interface GenerateJsonParams extends GenerateTextParams {
  schema: any; // The schema for the expected JSON object
}

/**
 * Defines the contract for any Large Language Model (LLM) provider.
 * This interface abstracts the specific SDKs (e.g., @google/genai, openai)
 * into a set of generic, low-level methods.
 */
export interface LLMProvider {
  /**
   * Generates a plain text response from a given prompt and model.
   * @param params - The parameters for the text generation request.
   * @returns A promise that resolves to the generated text string.
   */
  generateText(params: GenerateTextParams): Promise<string>;

  /**
   * Generates a JSON object that conforms to a provided schema.
   * @param params - The parameters for the JSON generation request, including the schema.
   * @returns A promise that resolves to the generated JSON object.
   */
  generateJson<T>(params: GenerateJsonParams): Promise<T>;

  // Future methods like `streamChat` or `generateImage` could be added here.
}