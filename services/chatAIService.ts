
import { Note, ChatMessage } from '../types';
import { GenerateTextParams } from './providers/types';
import { getConfig } from './aiService';

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
