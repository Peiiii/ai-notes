import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ProactiveSuggestion } from '../types';

interface ChatState {
  chatHistory: ChatMessage[];
  chatStatus: string | null; // Changed from isChatting: boolean
  isThreadChatting: boolean;
  proactiveSuggestions: ProactiveSuggestion[];
  isLoadingSuggestions: boolean;
}

export const useChatStore = create<ChatState>()(
  persist(
    () => ({
      chatHistory: [],
      chatStatus: null,
      isThreadChatting: false,
      proactiveSuggestions: [],
      isLoadingSuggestions: false,
    }),
    { 
        name: 'ai-notes-chathistory',
        partialize: (state) => ({ chatHistory: state.chatHistory }),
    }
  )
);