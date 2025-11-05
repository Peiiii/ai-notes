import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CrucibleSession } from '../types';

interface CrucibleState {
  sessions: CrucibleSession[];
  activeSessionId: string | null;
  addSession: (session: CrucibleSession) => void;
  updateSession: (sessionId: string, updates: Partial<Omit<CrucibleSession, 'id'>>) => void;
  deleteSession: (sessionId: string) => void;
  setActiveSessionId: (sessionId: string | null) => void;
}

export const useCrucibleStore = create<CrucibleState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      addSession: (session) => {
        set((state) => ({ sessions: [session, ...state.sessions] }));
      },
      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        }));
      },
      deleteSession: (sessionId) => {
        const isActive = get().activeSessionId === sessionId;
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: isActive ? null : state.activeSessionId,
        }));
      },
      setActiveSessionId: (sessionId) => {
        set({ activeSessionId: sessionId });
      },
    }),
    {
      name: 'ai-notes-crucible-sessions',
    }
  )
);
