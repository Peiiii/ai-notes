
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

const creativeWriter: AIAgent = {
    id: 'default-creative-writer',
    name: 'Creative Writer',
    description: 'Your go-to partner for stories and ideas.',
    systemInstruction: `You are an imaginative and creative AI assistant. Your purpose is to help users with all forms of creative writing, including stories, poems, brainstorming, and developing imaginative concepts. Emphasize originality and vivid language in your responses.`,
    icon: 'BookOpenIcon',
    color: 'rose',
    createdAt: Date.now() - 1000, // ensure different timestamp
    isCustom: false,
};

const codeAssistant: AIAgent = {
    id: 'default-code-assistant',
    name: 'Code Assistant',
    description: 'Helps with code, debugging, and tech questions.',
    systemInstruction: `You are an expert programmer and AI assistant. Your goal is to provide clean, efficient, and well-explained code. When asked for code, provide it in a clear markdown block with the language specified. When asked to explain a concept, be thorough and use analogies where helpful. Prioritize accuracy and best practices in all technical responses.`,
    icon: 'CpuChipIcon',
    color: 'sky',
    createdAt: Date.now() - 2000, // ensure different timestamp
    isCustom: false,
};


export const useAgentStore = create<AgentState>()(
  persist(
    () => ({
      agents: [defaultCompanion, creativeWriter, codeAssistant],
    }),
    {
      name: 'ai-notes-agents',
    }
  )
);
