
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '../types';

interface ParliamentState {
  topics: string[];
  isLoadingTopics: boolean;
  debateHistory: ChatMessage[];
  isDebating: boolean;
  currentDebate: { topic: string; noteId?: string } | null;
}

export const useParliamentStore = create<ParliamentState>()(
  persist(
    () => ({
      topics: [],
      isLoadingTopics: false,
      debateHistory: [],
      isDebating: false,
      currentDebate: null,
    }),
    {
      name: 'ai-notes-parliament-storage',
      partialize: (state) => ({ 
        topics: state.topics,
      }),
    }
  )
);
