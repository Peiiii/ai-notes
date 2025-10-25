import { AIProvider } from './AIProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const p0 = import.meta.env.VITE_AI_PROVIDER as string | undefined;
  let p = (p0 || '').toLowerCase();
  if (!p) {
    const hasOpenAIKey = !!(import.meta.env.VITE_OPENAI_API_KEY);
    const hasGeminiKey = !!(import.meta.env.VITE_GEMINI_API_KEY);
    p = hasOpenAIKey && !hasGeminiKey ? 'openai' : 'gemini';
  }
  switch (p) {
    case 'openai':
      cached = new OpenAIProvider();
      return cached;
    case 'gemini':
    default:
      cached = new GeminiProvider();
      return cached;
  }
}
