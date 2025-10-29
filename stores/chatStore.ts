
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatSession } from '../types';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  chatStatus: string | null; // e.g., 'Thinking...', 'Using tools...'
  isThreadChatting: boolean; // Keep this for note-specific chats
}

export const useChatStore = create<ChatState>()(
  persist(
    () => ({
      sessions: [],
      activeSessionId: null,
      chatStatus: null,
      isThreadChatting: false,
    }),
    { 
        name: 'ai-notes-chatsessions',
        partialize: (state) => ({ 
            sessions: state.sessions,
         }),
    }
  )
);
