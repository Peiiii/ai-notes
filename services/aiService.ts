import { Note, KnowledgeCard, ChatMessage, DebateSynthesis } from '../types';
import { geminiProvider } from './providers/geminiProvider';
import { openAIProvider, dashscopeProvider, deepseekProvider, openRouterProvider } from './providers/openaiProvider';
import { LLMProvider, GenerateJsonParams, GenerateTextParams, ModelTier } from './providers/types';
import { Type } from "@google/genai";

// --- Provider Registry ---
// All available providers are registered here. The key is a simple name we can reference.
const providers: { [key: string]: LLMProvider } = {
  gemini: geminiProvider,
  openai: openAIProvider,
  dashscope: dashscopeProvider,
  deepseek: deepseekProvider,
  openrouter: openRouterProvider,
};

// --- AI Capability Schemes ---
// Define different schemes for AI capabilities. A scheme maps each application
// feature to a specific provider and model. This allows for easy, high-level
// switching of AI configurations and supports mixing providers within a single scheme.

type CapabilityConfig = {
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
};

// A scheme that primarily uses Gemini models.
const geminiScheme: CapabilityConfig = {
  summary:        { provider: 'gemini', model: 'fast' },
  title:          { provider: 'gemini', model: 'fast' },
  chat:           { provider: 'gemini', model: 'fast' },
  threadChat:     { provider: 'gemini', model: 'fast' },
  pulseReport:    { provider: 'gemini', model: 'pro'  },
  wikiEntry:      { provider: 'gemini', model: 'lite' },
  relatedTopics:  { provider: 'gemini', model: 'lite' },
  subTopics:      { provider: 'gemini', model: 'lite' },
  wikiTopics:     { provider: 'gemini', model: 'lite' },
  debateTopics:   { provider: 'gemini', model: 'lite' },
  debateTurn:     { provider: 'gemini', model: 'lite' },
  debateSynthesis:{ provider: 'gemini', model: 'lite' },
  podcastTurn:    { provider: 'gemini', model: 'lite' },
  mindMap:        { provider: 'gemini', model: 'fast' },
};

// A scheme that primarily uses DashScope models.
const dashscopeScheme: CapabilityConfig = {
  summary:        { provider: 'dashscope', model: 'fast' },
  title:          { provider: 'dashscope', model: 'fast' },
  chat:           { provider: 'dashscope', model: 'fast' },
  threadChat:     { provider: 'dashscope', model: 'fast' },
  pulseReport:    { provider: 'dashscope', model: 'pro'  },
  wikiEntry:      { provider: 'dashscope', model: 'lite' },
  relatedTopics:  { provider: 'dashscope', model: 'lite' },
  subTopics:      { provider: 'dashscope', model: 'lite' },
  wikiTopics:     { provider: 'dashscope', model: 'lite' },
  debateTopics:   { provider: 'dashscope', model: 'lite' },
  debateTurn:     { provider: 'dashscope', model: 'lite' },
  debateSynthesis:{ provider: 'dashscope', model: 'lite' },
  podcastTurn:    { provider: 'dashscope', model: 'lite' },
  mindMap:        { provider: 'dashscope', model: 'fast' },
};

// A scheme that primarily uses OpenAI models.
const openaiScheme: CapabilityConfig = {
  summary:        { provider: 'openai', model: 'fast' },
  title:          { provider: 'openai', model: 'fast' },
  chat:           { provider: 'openai', model: 'fast' },
  threadChat:     { provider: 'openai', model: 'fast' },
  pulseReport:    { provider: 'openai', model: 'pro'  },
  wikiEntry:      { provider: 'openai', model: 'lite' },
  relatedTopics:  { provider: 'openai', model: 'lite' },
  subTopics:      { provider: 'openai', model: 'lite' },
  wikiTopics:     { provider: 'openai', model: 'lite' },
  debateTopics:   { provider: 'openai', model: 'lite' },
  debateTurn:     { provider: 'openai', model: 'lite' },
  debateSynthesis:{ provider: 'openai', model: 'lite' },
  podcastTurn:    { provider: 'openai', model: 'lite' },
  mindMap:        { provider: 'openai', model: 'fast' },
};

// A scheme that primarily uses DeepSeek models.
const deepseekScheme: CapabilityConfig = {
  summary:        { provider: 'deepseek', model: 'fast' },
  title:          { provider: 'deepseek', model: 'fast' },
  chat:           { provider: 'deepseek', model: 'fast' },
  threadChat:     { provider: 'deepseek', model: 'fast' },
  pulseReport:    { provider: 'deepseek', model: 'pro'  },
  wikiEntry:      { provider: 'deepseek', model: 'lite' },
  relatedTopics:  { provider: 'deepseek', model: 'lite' },
  subTopics:      { provider: 'deepseek', model: 'lite' },
  wikiTopics:     { provider: 'deepseek', model: 'lite' },
  debateTopics:   { provider: 'deepseek', model: 'lite' },
  debateTurn:     { provider: 'deepseek', model: 'lite' },
  debateSynthesis:{ provider: 'deepseek', model: 'lite' },
  podcastTurn:    { provider: 'deepseek', model: 'lite' },
  mindMap:        { provider: 'deepseek', model: 'fast' },
};

// A scheme that primarily uses OpenRouter models.
const openRouterScheme: CapabilityConfig = {
  summary:        { provider: 'openrouter', model: 'fast' },
  title:          { provider: 'openrouter', model: 'fast' },
  chat:           { provider: 'openrouter', model: 'fast' },
  threadChat:     { provider: 'openrouter', model: 'fast' },
  pulseReport:    { provider: 'openrouter', model: 'pro'  },
  wikiEntry:      { provider: 'openrouter', model: 'lite' },
  relatedTopics:  { provider: 'openrouter', model: 'lite' },
  subTopics:      { provider: 'openrouter', model: 'lite' },
  wikiTopics:     { provider: 'openrouter', model: 'lite' },
  debateTopics:   { provider: 'openrouter', model: 'lite' },
  debateTurn:     { provider: 'openrouter', model: 'lite' },
  debateSynthesis:{ provider: 'openrouter', model: 'lite' },
  podcastTurn:    { provider: 'openrouter', model: 'lite' },
  mindMap:        { provider: 'openrouter', model: 'fast' },
};

// Example of a future mixed scheme
// const customMixedScheme: CapabilityConfig = {
//   summary: { provider: 'gemini', model: 'pro' }, // Use powerful Gemini for big summaries
//   title:   { provider: 'dashscope', model: 'lite' }, // Use cheap DashScope for titles
//   chat:    { provider: 'openai', model: 'fast' }, // Use fast OpenAI for chat
//   // ... etc.
// };

const allSchemes: Record<string, CapabilityConfig> = {
    gemini: geminiScheme,
    dashscope: dashscopeScheme,
    openai: openaiScheme,
    deepseek: deepseekScheme,
    openrouter: openRouterScheme,
    // custom: customMixedScheme,
};

// --- Active Scheme Selection ---
// This is the central control panel for the application's AI.
// It uses the `AI_SCHEME` environment variable to select a capability scheme.
// If the variable is not set or invalid, it defaults to 'gemini' to align with the platform's default API key.
const activeSchemeName = process.env.AI_SCHEME || 'gemini';
const capabilityConfig = allSchemes[activeSchemeName] || allSchemes.gemini;

console.log(`Using AI Scheme: "${activeSchemeName}"`);

// Helper function to get the configured provider and model for a capability
export function getConfig(capability: keyof CapabilityConfig) {
    const config = capabilityConfig[capability];
    const provider = providers[config.provider];
    if (!provider) {
        throw new Error(`Provider "${config.provider}" is not registered for capability "${capability}".`);
    }
    return { provider, model: config.model };
}


// --- Capability Definitions ---
// Each function here represents a specific AI capability the application needs.
// It contains the business logic (prompts, schemas) and uses the getConfig helper
// to dynamically call the correct provider and model.

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        todos: {
            type: Type.ARRAY,
            description: "A list of actionable to-do items or tasks extracted from the notes.",
            items: { type: Type.STRING }
        },
        knowledgeCards: {
            type: Type.ARRAY,
            description: "A list of diverse, categorized knowledge cards generated based on the notes' content.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The category of the card. Must be one of the specified enum values.",
                        enum: ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea']
                    },
                    title: { type: Type.STRING, description: "A concise, engaging title for the card." },
                    content: { type: Type.STRING, description: "The detailed content of the card, providing value to the user." },
                    sources: {
                        type: Type.ARRAY,
                        description: "An array of URL strings citing the sources for encyclopedia cards. This is mandatory for the 'encyclopedia' type.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["type", "title", "content"]
            }
        }
    },
    required: ["todos", "knowledgeCards"]
};

export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
    if (notes.length === 0) return { todos: [], knowledgeCards: [] };

    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const prompt = `
Analyze the following collection of notes. Your task is to extract two types of information:
1.  Actionable to-do items.
2.  A diverse set of "Knowledge Cards" based on the content.

**Instructions for Knowledge Cards:**
Generate a variety of cards from the following categories. Be creative and insightful.
-   **encyclopedia**: For significant concepts, provide a concise summary of critical key points, MUST include an array of URLs for 'sources'.
-   **creative_story**: Write a short, imaginative story or scene.
-   **note_synthesis**: Synthesize key points from multiple related notes.
-   **new_theory**: Formulate a concise theory or principle from abstract ideas.
-   **idea**: For simple, standalone creative sparks.

**General Rules:**
-   Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are the notes:
${notesContent}`;
    
    const { provider, model } = getConfig('summary');
    const params: GenerateJsonParams = { model, prompt, schema: summarySchema };
    return provider.generateJson(params);
}

export async function generateTitleForNote(content: string): Promise<string> {
    if (!content) return "";
    
    const prompt = `Based on the following note content, generate a very short, concise, and relevant title (max 5 words).
IMPORTANT: Respond in the same language as the provided Content. Do not include any quotation marks or labels.

Content:
---
${content}
---

Title:`;

    const { provider, model } = getConfig('title');
    const params: GenerateTextParams = { model, prompt };
    const title = await provider.generateText(params);
    return title.replace(/["']/g, '').trim();
}

export async function generateChatResponse(notes: Note[], history: ChatMessage[], question: string): Promise<string> {
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const prompt = `You are an AI assistant for a note-taking app. Your purpose is to help the user understand and synthesize their own notes.
You have access to the user's entire collection of notes and the recent conversation history.
Answer the user's question based *only* on the information provided in their notes. Do not make things up.
If the notes don't contain the answer, say so politely. Be helpful, concise, and conversational.

--- CONVERSATION HISTORY ---
${historyContent}

--- ALL NOTES ---
${notesContent}

--- USER'S QUESTION ---
user: ${question}

model:`;
    
    const { provider, model } = getConfig('chat');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}

export async function generateThreadChatResponse(note: Note, question: string): Promise<string> {
    const noteContent = `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`;
    const history = note.threadHistory || [];
    const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const prompt = `You are an AI assistant focused on a single note. Your purpose is to help the user with the content of *this specific note*.
You can help them rewrite, brainstorm, summarize, or answer questions about it. Be helpful and conversational.
Base your answer *only* on the note's content and the recent conversation history provided.

--- CONVERSATION HISTORY ---
${historyContent}

--- NOTE CONTENT ---
${noteContent}

--- USER'S QUESTION ---
user: ${question}

model:`;
    
    const { provider, model } = getConfig('threadChat');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}

const pulseReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A compelling title for the report, like 'Your Weekly Pulse' or 'Thought Trajectory'.",
        },
        content: {
            type: Type.STRING,
            description: "A narrative report, written in markdown, summarizing the user's thought evolution."
        }
    },
    required: ["title", "content"]
};

export async function generatePulseReport(notes: Note[]): Promise<{ title: string; content: string }> {
    if (notes.length === 0) {
        return { title: "Not Enough Data", content: "Write at least one note to generate your first Pulse report." };
    }
    const notesContent = notes
        .map(note => `Date: ${new Date(note.createdAt).toISOString().split('T')[0]}\nTitle: ${note.title || 'Untitled'}\nContent: ${note.content}`)
        .join('\n\n---\n\n');
    
    const prompt = `
You are a highly perceptive thought analyst. Your task is to analyze a user's entire collection of notes and generate a short, insightful "Pulse Report" about their intellectual journey.
The report should be a narrative, not just a list. Be insightful and help the user see the bigger picture of their own thinking.

**Analyze the following aspects:**
1.  **Theme Evolution:** Identify the main topics. Have they shifted over time?
2.  **New Connections:** Find surprising links between different notes.
3.  **Forgotten Threads:** Resurface a significant idea from an older note.
4.  **Exploration Suggestions:** Suggest one or two new questions for them to explore.

**Formatting Rules:**
-   Use Markdown for formatting (e.g., # for title, ## for subtitles, * for lists).
-   The tone should be encouraging, insightful, and like a personal analyst.
-   Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are all the notes:
${notesContent}`;
    
    const { provider, model } = getConfig('pulseReport');
    const params: GenerateJsonParams = { model, prompt, schema: pulseReportSchema };
    return provider.generateJson(params);
}

const mindMapSchema = {
    type: Type.OBJECT,
    properties: {
        root: {
            type: Type.OBJECT,
            description: "The central root node of the mind map.",
            properties: {
                label: { type: Type.STRING, description: "The concise text label for the root node." },
                children: {
                    type: Type.ARRAY,
                    description: "An array of main branch nodes.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "The concise text label for a main branch node." },
                            children: {
                                type: Type.ARRAY,
                                description: "An array of sub-topic leaf nodes.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING, description: "The concise text label for a sub-topic leaf node." }
                                    },
                                    required: ['label']
                                }
                            }
                        },
                        required: ['label']
                    }
                }
            },
            required: ['label']
        }
    },
    required: ['root']
};

export async function generateMindMap(notes: Note[]): Promise<{ root: { label: string, children?: { label: string, children?: { label: string }[] }[] } }> {
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const prompt = `
Analyze the following collection of notes and generate a hierarchical mind map structure.

**Instructions:**
1.  **Root Node:** Identify the single most central theme or overarching topic from all the notes. This will be the root node.
2.  **Main Branches:** Identify 3 to 5 major themes or categories that branch off from the root node. These will be the main child nodes.
3.  **Sub-Topics:** For each major theme, identify 2 to 4 specific sub-points, concepts, or related ideas from the notes. These will be the children of the major theme nodes.
4.  **Strict Hierarchy:** The structure must be a strict hierarchy (a tree). Each sub-topic must belong to only one main branch. Do not share sub-topics between different branches.
5.  **Concise Labels:** Ensure the labels for each node are concise and descriptive (2-5 words).
6.  **Language:** Respond ONLY in the primary language used in the provided notes.
7.  **JSON Output:** Return the result as a single JSON object that strictly adheres to the provided schema.

Here are the notes:
${notesContent}`;

    const { provider, model } = getConfig('mindMap');
    const params: GenerateJsonParams = { model, prompt, schema: mindMapSchema };
    return provider.generateJson(params);
}