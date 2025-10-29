import { ChatMessage, ToolCall } from '../../types';

export type ModelTier = 'lite' | 'fast' | 'pro';

export interface GenerateTextParams {
  model: ModelTier;
  prompt: string;
  systemInstruction?: string;
}

export interface GenerateJsonParams extends GenerateTextParams {
  schema: any;
}

export interface GenerateWithToolsParams {
  model: ModelTier;
  history: ChatMessage[];
  tools: any[];
  systemInstruction?: string;
}

export interface GenerateWithToolsResult {
  text: string | null;
  toolCalls: ToolCall[] | null;
}

/**
 * Defines the contract for any Large Language Model (LLM) provider.
 */
export interface LLMProvider {
  /**
   * Generates a plain text response from a given prompt and model.
   */
  generateText(params: GenerateTextParams): Promise<string>;

  /**
   * Generates a JSON object that conforms to a provided schema.
   */
  generateJson<T>(params: GenerateJsonParams): Promise<T>;

  /**
   * Generates content with support for tool calling (function calling).
   * This is the core method for agentic behavior.
   */
  generateContentWithTools(params: GenerateWithToolsParams): Promise<GenerateWithToolsResult>;
}