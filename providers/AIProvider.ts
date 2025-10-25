// Generic provider interface so we can swap vendors (Gemini, OpenAI, etc.)
// without changing the rest of the app.

export type JsonSchema = {
  // Minimal JSON Schema subset we need. Keep it vendor-agnostic.
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
};

export type TextOptions = {
  model?: string;
  temperature?: number;
};

export type JsonOptions = TextOptions & {
  // Optional schema name for providers that require one (e.g., OpenAI Responses API)
  schemaName?: string;
};

export interface AIProvider {
  generateText(prompt: string, options?: TextOptions): Promise<string>;
  generateJson<T = unknown>(prompt: string, schema: JsonSchema, options?: JsonOptions): Promise<T>;
}

