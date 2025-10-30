
import { Note, ChatMessage } from '../types';
import { GenerateTextParams } from './providers/types';
import { getConfig } from './aiService';

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
