
import { geminiProvider } from './providers/geminiProvider';
import { openAIProvider, dashscopeProvider, deepseekProvider, openRouterProvider } from './providers/openaiProvider';
import { LLMProvider, ModelTier } from './providers/types';

// --- Provider Registry ---
const providers: { [key:string]: LLMProvider } = {
  gemini: geminiProvider,
  openai: openAIProvider,
  dashscope: dashscopeProvider,
  deepseek: deepseekProvider,
  openrouter: openRouterProvider,
};

// --- AI Capability Schemes ---
export type CapabilityConfig = {
  [key: string]: { provider: string; model: ModelTier };
  summary:        { provider: string; model: ModelTier };
  title:          { provider: string; model: ModelTier };
  chat:           { provider: string; model: ModelTier };
  threadChat:     { provider: string; model: ModelTier };
  pulseReport:    { provider: string; model: ModelTier };
  wikiEntry:      { provider: string; model: ModelTier };
  relatedTopics:  { provider: string; model: ModelTier };
  subTopics:      { provider: string; model: ModelTier };
  wikiTopics:     { provider: string; model: ModelTier };
  debateTopics:   { provider: string; model: ModelTier };
  debateTurn:     { provider: string; model: ModelTier };
  debateSynthesis:{ provider: string; model: ModelTier };
  podcastTurn:    { provider: string; model: ModelTier };
  mindMap:        { provider: string; model: ModelTier };
  agent_reasoning:{ provider: string; model: ModelTier };
  agent_retrieval:{ provider: string; model: ModelTier };
  agent_final_answer: { provider: string; model: ModelTier };
  agent_proactive:{ provider: string; model: ModelTier };
  proactiveSuggestions: { provider: string; model: ModelTier };
};

const baseScheme: Record<string, { model: ModelTier; provider?: string }> = {
  summary:        { model: 'fast' },
  title:          { model: 'fast' },
  chat:           { model: 'fast' },
  threadChat:     { model: 'fast' },
  pulseReport:    { model: 'pro'  },
  wikiEntry:      { model: 'lite' },
  relatedTopics:  { model: 'lite' },
  subTopics:      { model: 'lite' },
  wikiTopics:     { model: 'lite' },
  debateTopics:   { model: 'lite' },
  debateTurn:     { model: 'lite' },
  debateSynthesis:{ model: 'lite' },
  podcastTurn:    { model: 'lite' },
  mindMap:        { model: 'fast' },
  agent_reasoning:{ model: 'fast' },
  agent_retrieval:{ model: 'lite' },
  agent_final_answer: { model: 'fast'},
  agent_proactive:{ model: 'lite' },
  proactiveSuggestions: { model: 'pro' },
};

const buildScheme = (provider: string): CapabilityConfig => 
  Object.entries(baseScheme).reduce((acc, [key, value]) => {
    acc[key as keyof CapabilityConfig] = { provider, ...value };
    return acc;
  }, {} as CapabilityConfig);


const allSchemes: Record<string, CapabilityConfig> = {
    gemini: buildScheme('gemini'),
    dashscope: buildScheme('dashscope'),
    openai: buildScheme('openai'),
    deepseek: buildScheme('deepseek'),
    openrouter: buildScheme('openrouter'),
};

// Create a new scheme for quick testing where all models are 'lite'
const quickTestScheme = JSON.parse(JSON.stringify(allSchemes.gemini));
for (const key in quickTestScheme) {
    quickTestScheme[key as keyof CapabilityConfig].model = 'lite';
}
allSchemes['quick-test'] = quickTestScheme;


// --- Active Scheme Selection ---
const activeSchemeName = process.env.AI_SCHEME || 'quick-test';
const capabilityConfig = allSchemes[activeSchemeName] || allSchemes.gemini;

console.log(`Using AI Scheme: "${activeSchemeName}"`);

export function getConfig(capability: keyof CapabilityConfig) {
    const config = capabilityConfig[capability];
    const provider = providers[config.provider];
    if (!provider) {
        throw new Error(`Provider "${config.provider}" is not registered for capability "${capability}".`);
    }
    return { provider, model: config.model };
}