
import { Note, KnowledgeCard, ChatMessage } from '../types';
import { geminiProvider } from './providers/geminiProvider';
import { openAIProvider } from './providers/openaiProvider';
import { LLMProvider, GenerateJsonParams, GenerateTextParams, ModelTier } from './providers/types';
import { Type } from "@google/genai";

// --- Provider Registry ---
// All available providers are registered here. The key is a simple name we can reference.
const providers: { [key: string]: LLMProvider } = {
  gemini: geminiProvider,
  openai: openAIProvider,
};

// --- Capability Configuration ---
// This is the central control panel for the application's AI.
// For each capability, specify the provider and the model tier to use.
// This allows mixing and matching providers for optimal performance and cost.
const capabilityConfig = {
  summary:        { provider: 'gemini', model: 'fast' as ModelTier },
  title:          { provider: 'gemini', model: 'fast' as ModelTier },
  chat:           { provider: 'gemini', model: 'fast' as ModelTier },
  pulseReport:    { provider: 'gemini', model: 'pro'  as ModelTier },
  wikiEntry:      { provider: 'gemini', model: 'lite' as ModelTier },
  relatedTopics:  { provider: 'gemini', model: 'lite' as ModelTier },
  subTopics:      { provider: 'gemini', model: 'lite' as ModelTier },
  wikiTopics:     { provider: 'gemini', model: 'lite' as ModelTier },
  debateTopics:   { provider: 'gemini', model: 'fast' as ModelTier },
  debateTurn:     { provider: 'gemini', model: 'pro'  as ModelTier },
  debateSynthesis:{ provider: 'gemini', model: 'pro'  as ModelTier },
};

// Helper function to get the configured provider and model for a capability
export function getConfig(capability: keyof typeof capabilityConfig) {
    const config = capabilityConfig[capability];
    const provider = providers[config.provider];
    if (!provider) {
        throw new Error(`Provider "${config.provider}" is not registered.`);
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