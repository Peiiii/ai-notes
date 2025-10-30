import { Note, KnowledgeCard, ChatMessage, DebateSynthesis, ToolCall, ProactiveSuggestion } from '../types';
import { geminiProvider, GEMINI_MODELS } from './providers/geminiProvider';
import { openAIProvider, dashscopeProvider, deepseekProvider, openRouterProvider } from './providers/openaiProvider';
import { LLMProvider, GenerateJsonParams, GenerateTextParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult, StreamChunk } from './providers/types';
// Fix: Imported `GoogleGenAI` to resolve 'Cannot find name' error.
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Command } from '../commands';

// --- Provider Registry ---
const providers: { [key: string]: LLMProvider } = {
  gemini: geminiProvider,
  openai: openAIProvider,
  dashscope: dashscopeProvider,
  deepseek: deepseekProvider,
  openrouter: openRouterProvider,
};

// --- AI Capability Schemes ---
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
  relatedTopics:  { provider: 'gemini', model: 'lite' },
  subTopics:      { provider: 'gemini', model: 'lite' },
  wikiTopics:     { provider: 'gemini', model: 'lite' },
  debateTopics:   { provider: 'gemini', model: 'lite' },
  debateTurn:     { provider: 'gemini', model: 'lite' },
  debateSynthesis:{ provider: 'gemini', model: 'lite' },
  podcastTurn:    { provider: 'gemini', model: 'lite' },
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


// --- Agent Tools Definition ---
const searchNotesTool: FunctionDeclaration = {
    name: 'search_notes',
    description: "Searches the user's notes to find information relevant to their query. Use this to answer questions about past notes.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: "The specific topic or question to search for in the notes." }
        },
        required: ['query']
    }
};

const createNoteTool: FunctionDeclaration = {
    name: 'create_note',
    description: "Creates a new note with a given title and content. Use this when the user explicitly asks to create a note, or to save the result of a complex task.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The title of the new note." },
            content: { type: Type.STRING, description: "The main content of the new note, formatted in Markdown." }
        },
        required: ['title', 'content']
    }
};

export const agentTools = [searchNotesTool, createNoteTool];

export const createNewAgentTool: FunctionDeclaration = {
    name: 'create_new_agent',
    description: "Creates a new AI agent based on the user's specifications. Use this tool ONLY when you have collected the name, description, and system instructions from the user.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name for the new AI agent." },
            description: { type: Type.STRING, description: "A short, one-sentence description of the agent's purpose." },
            systemInstruction: { type: Type.STRING, description: "The detailed system instructions defining the agent's personality, capabilities, and constraints." },
            icon: { type: Type.STRING, description: "Optional: Suggest an icon name from this list: SparklesIcon, BookOpenIcon, CpuChipIcon, LightbulbIcon, BeakerIcon, UsersIcon. Default is SparklesIcon." },
            color: { type: Type.STRING, description: "Optional: Suggest a color from this list: slate, indigo, sky, purple, amber, rose, green. Default is indigo." }
        },
        required: ['name', 'description', 'systemInstruction']
    }
};

export const moderatorTools: FunctionDeclaration[] = [
    {
        name: 'select_next_speaker',
        description: "Selects the next AI agent to speak in the discussion.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                agent_name: { 
                    type: Type.STRING, 
                    description: "The exact name of the agent who should speak next." 
                },
                reason: {
                    type: Type.STRING,
                    description: "A brief reason why this agent was chosen to speak next."
                }
            },
            required: ['agent_name', 'reason']
        }
    },
    {
        name: 'end_discussion',
        description: "Ends the current discussion turn when the user's query has been fully addressed.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                 summary: {
                    type: Type.STRING,
                    description: "A brief summary of why the discussion is ending."
                }
            },
            required: ['summary']
        }
    }
];

export async function getModeratorResponse(history: ChatMessage[], availableAgents: string[], spokenAgentNames: string[]): Promise<GenerateWithToolsResult> {
    const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
    const systemInstruction = `You are an expert AI moderator orchestrating a group chat. Your goal is to facilitate a productive conversation that fully addresses all of the user's questions and requests. You are in a continuous decision loop.

**Current State of the Conversation:**
*   **User's Goal (Analyze the whole history):** Based on the entire chat history, what is the user trying to achieve? Pay special attention to their most recent messages. Is there an unanswered question or a pending request?
*   **Last User Message:** "${lastUserMessage}"
*   **Available Agents:** [${availableAgents.join(', ')}]
*   **Agents who have spoken recently in this turn:** [${spokenAgentNames.join(', ')}]

**Your Process:**
1.  **Analyze the current state.** Read the latest messages carefully. Is the user's most recent query resolved?
2.  **Decide the next action using a tool:**
    *   If the user has asked a question or the previous one is not fully answered, use \`select_next_speaker\` to call on the most relevant agent to continue the conversation.
    *   If the user's request implies multiple participants (e.g., "everyone introduce yourselves"), you MUST call \`select_next_speaker\` for each required agent, one by one, that has not yet spoken in this turn.
    *   Use \`end_discussion\` ONLY when the conversation has reached a natural conclusion and the user's latest queries are fully satisfied.

**CRITICAL RULES:**
1.  **Don't End Prematurely:** Do not use \`end_discussion\` if the user has just asked a question, even if it's a follow-up. Your primary job is to get the user an answer. If in doubt, select a speaker.
2.  **Re-select Speakers:** It is acceptable to call \`select_next_speaker\` on an agent that has already spoken in this turn if they are the most relevant person to answer a new user query.
3.  **Tool Only:** You MUST respond with only a tool call. Do not add any conversational text.`;
    
    const { provider, model } = getConfig('agent_reasoning');

    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: moderatorTools,
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}

// --- Agent Core Function ---
export async function getAgentResponse(history: ChatMessage[], command?: Command, customSystemInstruction?: string): Promise<GenerateWithToolsResult> {
    let systemInstruction = customSystemInstruction || `You are a powerful AI assistant integrated into a note-taking app. 
- You can search existing notes to answer questions.
- You can create new notes.
- When answering a question based on a search, be concise and directly state the answer.
- After answering from a search, ask the user if they would like you to create a new note with the synthesized information.
- Always respond in the user's language.`;

    if (command) {
      systemInstruction = `The user has issued a specific command: /${command.name}. You MUST follow these instructions precisely to fulfill their request.
--- COMMAND DEFINITION ---
${command.definition}
---
After fulfilling the command, respond naturally.

Original general instructions (for context):
${systemInstruction}`;
    }

    const { provider, model } = getConfig('agent_reasoning');
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: agentTools,
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}

export async function getAgentTextStream(history: ChatMessage[], systemInstruction: string): Promise<AsyncGenerator<StreamChunk>> {
    const { provider, model } = getConfig('agent_reasoning');
    return provider.generateTextStream({
        model,
        history,
        systemInstruction,
    });
}

export async function getCreatorAgentResponse(history: ChatMessage[]): Promise<GenerateWithToolsResult> {
    const systemInstruction = `You are the 'Agent Architect'. Your role is to help the user create a new AI agent by having a friendly conversation with them.
- Your goal is to gather three key pieces of information: a **name**, a short **description**, and the detailed **system instructions** for the new agent.
- Guide the user step-by-step. Start by asking for the name. Then the description. Then the system instructions.
- Be encouraging and helpful throughout the process.
- Once you are confident you have all three pieces of information, you MUST use the \`create_new_agent\` tool to finalize the creation.
- You can also suggest an icon and color for the agent, but it's not required.`;

    const { provider, model } = getConfig('agent_reasoning'); // Reuse the reasoning model
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: [createNewAgentTool],
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}


// --- RAG Retrieval Function ---
const retrievalSchema = {
    type: Type.ARRAY,
    description: "An array of note IDs that are most relevant to the user's query.",
    items: { type: Type.STRING }
};
export async function searchNotesInCorpus(query: string, notes: Note[]): Promise<Note[]> {
    if (notes.length === 0) return [];

    const notesForRetrieval = notes.map(note => ({
        id: note.id,
        title: note.title,
        preview: note.content.substring(0, 150)
    }));

    const prompt = `From the following list of notes, please select the IDs of the 3-5 notes that are most relevant to the user's query.

User Query: "${query}"

Note List:
${JSON.stringify(notesForRetrieval)}

Return only a JSON array of the most relevant note IDs.`;

    const { provider, model } = getConfig('agent_retrieval');
    try {
        const relevantIds = await provider.generateJson<string[]>({ model, prompt, schema: retrievalSchema });
        
        if (!Array.isArray(relevantIds)) {
            console.warn("Retrieved relevant IDs is not an array:", relevantIds);
            return [];
        }
        
        return notes.filter(note => relevantIds.includes(note.id));
    } catch (error) {
        console.error("Failed to retrieve relevant notes:", error);
        return []; // Return empty on failure to prevent crashing the agent
    }
}

export async function generateFinalAnswerFromContext(query: string, contextNotes: Note[]): Promise<string> {
    if (contextNotes.length === 0) {
        return "I couldn't find any relevant information in your notes to answer that question.";
    }

    const context = contextNotes.map(note => `Title: ${note.title}\nContent:\n${note.content}`).join('\n\n---\n\n');

    const prompt = `Based *strictly* on the provided note context below, answer the user's query in a concise and helpful way.

User Query: "${query}"

Note Context:
---
${context}
---

Answer:`;
    
    const { provider, model } = getConfig('agent_final_answer');
    return provider.generateText({ model, prompt });
}


// --- Proactive Insights ---
const findRelatedNotesTool: FunctionDeclaration = {
    name: 'find_related_notes',
    description: "Based on the user's current text, finds a single highly relevant note from their existing notes.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: "The core topic or concept from the user's text to search for in other notes." }
        },
        required: ['topic']
    }
};

const identifyActionItemTool: FunctionDeclaration = {
    name: 'identify_action_item',
    description: "Identifies a single, clear, and actionable to-do item from the user's text.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            task: { type: Type.STRING, description: "The full text of the identified to-do item." }
        },
        required: ['task']
    }
};

const identifyWikiConceptTool: FunctionDeclaration = {
    name: 'identify_wiki_concept',
    description: "Identifies a new, significant concept or term from the user's text that would be suitable for a new wiki entry.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            term: { type: Type.STRING, description: "The specific term or concept identified." }
        },
        required: ['term']
    }
};

export const insightTools = [findRelatedNotesTool, identifyActionItemTool, identifyWikiConceptTool];

export async function getLiveInsights(textSnippet: string, allNotes: Note[]): Promise<GenerateWithToolsResult> {
    const systemInstruction = `You are a proactive assistant analyzing a user's writing in real-time. Your goal is to be as helpful as possible by finding relevant connections and suggestions.
- Use 'find_related_notes' to link to existing knowledge. Be liberal; it's better to show a loosely related note than nothing.
- Use 'identify_action_item' to capture potential tasks.
- Use 'identify_wiki_concept' to suggest knowledge base expansion for key terms.
You have access to the titles of all notes for context.

All Note Titles:
- ${allNotes.map(n => n.title).filter(Boolean).join('\n- ')}
`;

    const history: ChatMessage[] = [{
        id: crypto.randomUUID(),
        role: 'user',
        content: `Here is the latest text snippet I'm writing:\n\n"${textSnippet}"`
    }];

    const { provider, model } = getConfig('agent_proactive');
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: insightTools,
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}

// --- Proactive Chat Suggestions ---
const proactiveSuggestionsSchema = {
    type: Type.ARRAY,
    description: "An array of 3-4 proactive suggestions for the user.",
    items: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "The text of the suggestion, ready to be sent as a user message (e.g., 'Summarize my recent notes')."
            },
            description: {
                type: Type.STRING,
                description: "A brief, user-facing explanation of why this suggestion is being made (e.g., 'To catch you up on your latest thoughts.')."
            }
        },
        required: ["prompt", "description"]
    }
};

export async function generateProactiveSuggestions(notes: Note[]): Promise<ProactiveSuggestion[]> {
    if (notes.length === 0) return [];

    const notesContent = notes
        .slice(0, 15) // Limit context size
        .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content.substring(0, 500)}...`)
        .join('\n\n---\n\n');

    const prompt = `You are a proactive AI assistant in a note-taking app. Your goal is to be insightful and helpful. Analyze the following user notes and generate 3-4 interesting and relevant conversation starters or tasks for the user. Frame them as prompts that the user could give you.

**Possible Suggestion Types:**
- **Summarize recent notes:** If there are new, unprocessed notes. (e.g., "Summarize my last 3 notes.")
- **Connect ideas:** Find a non-obvious link between two or more notes. (e.g., "What's the connection between my note on 'Stoicism' and the one on 'Productivity'?")
- **Create a wiki entry:** Identify a recurring key concept that could be expanded upon. (e.g., "Create a wiki page for 'Mental Models'.")
- **Identify a forgotten idea:** Resurface an interesting point from an older note. (e.g., "Remind me about that idea I had on 'asynchronous communication'.")

**Rules:**
- Provide a diverse set of suggestions.
- Keep the suggestion prompt text concise and conversational.
- Keep the description short and user-friendly.
- Base your suggestions strictly on the provided notes.
- Respond in the primary language used in the notes.
- Respond ONLY with a valid JSON object conforming to the schema.

**Notes:**
---
${notesContent}
---`;
    
    const { provider, model } = getConfig('proactiveSuggestions');
    const params: GenerateJsonParams = { model, prompt, schema: proactiveSuggestionsSchema };
    return provider.generateJson(params);
}


// --- Legacy Capability Definitions (unchanged) ---
// The following functions are kept as they were for other parts of the app.

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        todos: {
            type: Type.ARRAY,
            description: "A list of actionable to-do items extracted from the notes.",
            items: {
                type: Type.STRING
            }
        },
        knowledgeCards: {
            type: Type.ARRAY,
            description: "A diverse list of knowledge cards based on the notes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The type of knowledge card.",
                        enum: ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea']
                    },
                    title: {
                        type: Type.STRING,
                        description: "The title of the knowledge card."
                    },
                    content: {
                        type: Type.STRING,
                        description: "The main content of the knowledge card."
                    },
                    sources: {
                        type: Type.ARRAY,
                        description: "An array of source URLs, required for 'encyclopedia' type cards.",
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ['type', 'title', 'content']
            }
        }
    },
    required: ['todos', 'knowledgeCards']
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
            description: "The main title for the Pulse Report."
        },
        content: {
            type: Type.STRING,
            description: "The full content of the Pulse Report, formatted in Markdown."
        }
    },
    required: ['title', 'content']
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

const mindMapNodeSchema: any = {
    type: Type.OBJECT,
    properties: {
        label: {
            type: Type.STRING,
            description: "The concise label for this node."
        },
        children: {
            type: Type.ARRAY,
            description: "An array of child nodes.",
            items: {} // Placeholder for recursion
        }
    },
    required: ['label']
};
mindMapNodeSchema.properties.children.items = {
    ...mindMapNodeSchema,
    properties: {
        ...mindMapNodeSchema.properties,
        children: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING } },
                required: ['label']
            }
        }
    }
};

const mindMapSchema = {
    type: Type.OBJECT,
    properties: {
        root: mindMapNodeSchema
    },
    required: ['root']
};

export async function generateMindMap(notes: Note[]): Promise<{ root: { label: string, children?: any[] } }> {
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