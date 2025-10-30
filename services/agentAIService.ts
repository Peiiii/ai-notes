
import { ChatMessage, ToolCall, AIAgent, Note } from '../types';
import { Command } from '../commands';
import { getConfig } from './aiService';
import { GenerateWithToolsParams, GenerateWithToolsResult, StreamChunk } from './providers/types';
import { Type, FunctionDeclaration } from "@google/genai";


// --- Agent Tools Definition ---
export const searchNotesTool: FunctionDeclaration = {
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

export const createNoteTool: FunctionDeclaration = {
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
        name: 'pass_control_to_user',
        description: "Passes control back to the user when the AI's turn is complete because the user's request has been fulfilled or the conversation has reached a natural stopping point.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                 reason: {
                    type: Type.STRING,
                    description: "A brief, user-facing summary of what was accomplished before passing control back."
                }
            },
            required: ['reason']
        }
    }
];

export async function getModeratorResponse(history: ChatMessage[], availableAgents: string[], spokenAgentNames: string[], mentionedAgentNames: string[]): Promise<GenerateWithToolsResult> {
    const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
    const mentionInstruction = mentionedAgentNames.length > 0
        ? `\n*   **Mentions:** The user specifically mentioned: [${mentionedAgentNames.join(', ')}]. You should strongly prioritize selecting one of these agents if their expertise is relevant.`
        : '';

    const systemInstruction = `You are an expert AI moderator orchestrating a group chat. Your goal is to facilitate a productive conversation that fully addresses all of the user's questions and requests. You are in a continuous decision loop.

**Current State of the Conversation:**
*   **User's Goal (Analyze the whole history):** Based on the entire chat history, what is the user trying to achieve? Pay special attention to their most recent messages. Is there an unanswered question or a pending request?
*   **Last User Message:** "${lastUserMessage}"
*   **Available Agents:** [${availableAgents.join(', ')}]
*   **Agents who have spoken recently in this turn:** [${spokenAgentNames.join(', ')}]${mentionInstruction}

**Your Process:**
1.  **Analyze the current state.** Read the latest messages carefully. Is the user's most recent query resolved?
2.  **Decide the next action using a tool:**
    *   If the user has asked a question or the previous one is not fully answered, use \`select_next_speaker\` to call on the most relevant agent to continue the conversation.
    *   If the user's request implies multiple participants (e.g., "everyone introduce yourselves"), you MUST call \`select_next_speaker\` for each required agent, one by one, that has not yet spoken in this turn.
    *   Use \`pass_control_to_user\` ONLY when the conversation has reached a natural conclusion for now, the user's latest queries are fully satisfied, and it's time to wait for the user to speak next. For example, after fulfilling a request like "create a note", you should pass control back.

**CRITICAL RULES:**
1.  **Don't Pass Control Prematurely:** Do not use \`pass_control_to_user\` if the user has just asked a question, even if it's a follow-up. Your primary job is to get the user an answer. If in doubt, select a speaker.
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
export async function getAgentResponse(history: ChatMessage[], command?: Command, customSystemInstruction?: string, agentCount?: number): Promise<GenerateWithToolsResult> {
    let systemInstruction = customSystemInstruction || `You are a powerful AI assistant integrated into a note-taking app. 
- You can search existing notes to answer questions.
- You can create new notes.
- If your internal knowledge is insufficient or the user asks for recent information, use Google Search to find the answer.
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
        useGoogleSearch: true,
        agentCount,
    };
    return provider.generateContentWithTools(params);
}

export async function getAgentToolResponse(history: ChatMessage[], agent: AIAgent, allAgentNames: string[]): Promise<GenerateWithToolsResult> {
    const participantNames = allAgentNames.join(', ');
    const systemInstruction = `You are ${agent.name}. You are participating in a group chat with other AI agents: ${participantNames}.

**Your Capabilities:**
- You have access to tools like searching notes and creating new ones.
- You can use Google Search for up-to-date information if the user's query cannot be answered from the conversation history or your own knowledge.

**Conversation Format Rules:**
- User messages are from the human user you are assisting.
- Messages prefixed like "[Agent Name]: ..." are from other AI agents in the chat.
- System messages like "[Moderator chose ...]" provide context on the conversation flow.

**Your Current Task:**
The Moderator has selected you to speak next. Read the entire conversation history to understand the context, then provide your response based on your specific instructions below.

**CRITICAL RESPONSE INSTRUCTION:**
You MUST NOT prepend your name or any other prefix (e.g., "[${agent.name}]:" or "[Moderator]:") to your response. The user interface already handles displaying your name. Respond with your message content directly.

Your primary instructions are:
---
${agent.systemInstruction}`;
    
    const { provider, model } = getConfig('agent_reasoning');
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: agentTools, // Use the same tools as the single-agent chat
        systemInstruction,
        useGoogleSearch: true,
        agentCount: allAgentNames.length,
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
