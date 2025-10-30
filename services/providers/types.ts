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

export interface StreamChunk {
  text: string | null;
}

export type GenerateTextStreamParams = Omit<GenerateWithToolsParams, 'tools'>;


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

  /**
   * Generates a stream of text chunks for real-time responses.
   */
  generateTextStream(params: GenerateTextStreamParams): Promise<AsyncGenerator<StreamChunk>>;
}
