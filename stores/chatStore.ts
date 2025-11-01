
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatSession, ChatMessage, ProactiveSuggestion } from '../types';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isThreadChatting: boolean; // Keep this for note-specific chats
  suggestions: ProactiveSuggestion[];
  isLoadingSuggestions: boolean;
  
  // New granular methods for better state management with streams
  addMessage: (sessionId: string, message: ChatMessage) => void;
  addMessages: (sessionId: string, messages: ChatMessage[]) => void;
  appendContentToMessage: (sessionId: string, messageId: string, contentChunk: string) => void;
  updateMessageStatus: (sessionId: string, messageId: string, status: ChatMessage['status']) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      isThreadChatting: false,
      suggestions: [],
      isLoadingSuggestions: false,
      
      addMessage: (sessionId, message) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId 
              ? { ...session, history: [...session.history, message] }
              : session
          )
        }));
      },
      
      addMessages: (sessionId, messages) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, history: [...session.history, ...messages] }
              : session
          )
        }));
      },

      appendContentToMessage: (sessionId, messageId, contentChunk) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  history: session.history.map(msg =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + contentChunk }
                      : msg
                  )
                }
              : session
          )
        }));
      },
      
      updateMessageStatus: (sessionId, messageId, status) => {
          set(state => ({
              sessions: state.sessions.map(session =>
                  session.id === sessionId
                      ? {
                          ...session,
                          history: session.history.map(msg =>
                              msg.id === messageId ? { ...msg, status } : msg
                          )
                      }
                      : session
              )
          }));
      },

      updateMessage: (sessionId, messageId, updates) => {
        set(state => ({
            sessions: state.sessions.map(session =>
                session.id === sessionId
                    ? {
                        ...session,
                        history: session.history.map(msg =>
                            msg.id === messageId ? { ...msg, ...updates } : msg
                        )
                    }
                    : session
            )
        }));
      },

      updateSession: (sessionId, updates) => {
        set(state => ({
            sessions: state.sessions.map(session =>
                session.id === sessionId ? { ...session, ...updates } : session
            )
        }));
      },

    }),
    { 
        name: 'ai-notes-chatsessions',
        partialize: (state) => ({ 
            sessions: state.sessions,
         }),
    }
  )
);
