import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ParliamentSession } from '../types';

interface ParliamentState {
  topics: string[];
  isLoadingTopics: boolean;
  sessions: ParliamentSession[];
  activeSessionId: string | null;
  isGenerating: boolean;
}

export const useParliamentStore = create<ParliamentState>()(
  persist(
    () => ({
      topics: [],
      isLoadingTopics: false,
      sessions: [],
      activeSessionId: null,
      isGenerating: false,
    }),
    {
      name: 'ai-notes-parliament-storage',
      partialize: (state) => ({ 
        topics: state.topics,
        sessions: state.sessions,
      }),
    }
  )
);
