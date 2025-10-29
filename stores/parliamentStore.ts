import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ParliamentMode } from '../types';

interface ParliamentState {
  topics: string[];
  isLoadingTopics: boolean;
  sessionHistory: ChatMessage[];
  isSessionActive: boolean;
  currentSession: { 
    mode: ParliamentMode;
    topic: string;
    noteId?: string;
  } | null;
}

export const useParliamentStore = create<ParliamentState>()(
  persist(
    () => ({
      topics: [],
      isLoadingTopics: false,
      sessionHistory: [],
      isSessionActive: false,
      currentSession: null,
    }),
    {
      name: 'ai-notes-parliament-storage',
      partialize: (state) => ({ 
        topics: state.topics,
      }),
    }
  )
);