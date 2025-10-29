
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '../types';

interface ChatState {
  chatHistory: ChatMessage[];
  isChatting: boolean;
  isThreadChatting: boolean;
}

export const useChatStore = create<ChatState>()(
  persist(
    () => ({
      chatHistory: [],
      isChatting: false,
      isThreadChatting: false,
    }),
    { 
        name: 'ai-notes-chathistory',
        partialize: (state) => ({ chatHistory: state.chatHistory }),
    }
  )
);