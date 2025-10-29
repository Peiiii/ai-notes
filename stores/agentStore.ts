
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIAgent } from '../types';

interface AgentState {
  agents: AIAgent[];
}

const defaultCompanion: AIAgent = {
    id: 'default-companion',
    name: 'AI Companion',
    description: 'Your default AI thought partner.',
    systemInstruction: `You are a powerful AI assistant integrated into a note-taking app. 
- You can search existing notes to answer questions.
- You can create new notes.
- When answering a question based on a search, be concise and directly state the answer.
- After answering from a search, ask the user if they would like you to create a new note with the synthesized information.
- Always respond in the user's language.`,
    icon: 'SparklesIcon',
    color: 'indigo',
    createdAt: Date.now(),
    isCustom: false,
};

export const useAgentStore = create<AgentState>()(
  persist(
    () => ({
      agents: [defaultCompanion],
    }),
    {
      name: 'ai-notes-agents',
    }
  )
);