import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CrucibleSession, CrucibleContentBlock, CrucibleExpansionState, CrucibleTask } from '../types';

interface CrucibleState {
  sessions: CrucibleSession[];
  activeSessionId: string | null;
  addSession: (session: CrucibleSession) => void;
  updateSession: (sessionId: string, updates: Partial<Omit<CrucibleSession, 'id'>>) => void;
  deleteSession: (sessionId: string) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  addContentBlock: (sessionId: string, block: CrucibleContentBlock, parentBlockId?: string) => void;
  
  // New methods for managing expansion history
  addExpansion: (sessionId: string, expansion: CrucibleExpansionState) => void;
  updateExpansion: (sessionId: string, expansionId: string, updates: Partial<Omit<CrucibleExpansionState, 'id'>>) => void;
  removeExpansion: (sessionId: string, expansionId: string) => void;
  clearExpansionHistory: (sessionId: string) => void;

  // Methods for managing active tasks
  addTask: (sessionId: string, task: CrucibleTask) => void;
  updateTask: (sessionId: string, taskId: string, updates: Partial<Omit<CrucibleTask, 'id'>>) => void;
  removeTask: (sessionId: string, taskId: string) => void;
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
      addContentBlock: (sessionId, block, parentBlockId) => {
        set(state => {
            const session = state.sessions.find(s => s.id === sessionId);
            if (!session) return state;

            const newBlocks = [...session.contentBlocks];
            const parentIndex = parentBlockId ? newBlocks.findIndex(b => b.id === parentBlockId) : -1;
            
            if (parentIndex !== -1) {
                newBlocks.splice(parentIndex + 1, 0, block);
            } else {
                newBlocks.push(block);
            }

            return {
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, contentBlocks: newBlocks } : s)
            };
        });
      },
      
      // --- Expansion History Management ---
      addExpansion: (sessionId, expansion) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { ...s, expansionHistory: [expansion, ...(s.expansionHistory || [])] }
              : s
          )
        }));
      },
      updateExpansion: (sessionId, expansionId, updates) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { 
                  ...s, 
                  expansionHistory: (s.expansionHistory || []).map(e => 
                    e.id === expansionId ? { ...e, ...updates } : e
                  ) 
                }
              : s
          )
        }));
      },
      removeExpansion: (sessionId, expansionId) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { ...s, expansionHistory: (s.expansionHistory || []).filter(e => e.id !== expansionId) }
              : s
          )
        }));
      },
      clearExpansionHistory: (sessionId) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, expansionHistory: [] } : s
          )
        }));
      },

      // --- Task Management ---
      addTask: (sessionId, task) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? { ...s, tasks: [task, ...(s.tasks || [])] }
              : s
          )
        }));
      },
      updateTask: (sessionId, taskId, updates) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  tasks: (s.tasks || []).map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                  )
                }
              : s
          )
        }));
      },
      removeTask: (sessionId, taskId) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? { ...s, tasks: (s.tasks || []).filter(t => t.id !== taskId) }
              : s
          )
        }));
      },
    }),
    {
      name: 'ai-notes-crucible-sessions',
    }
  )
);
