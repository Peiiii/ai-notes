import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CrucibleSession, CrucibleContentBlock, CrucibleTask } from '../types';

interface CrucibleState {
  sessions: CrucibleSession[];
  activeSessionId: string | null;
  tasks: CrucibleTask[]; // Non-persisted task queue
  addSession: (session: CrucibleSession) => void;
  updateSession: (sessionId: string, updates: Partial<Omit<CrucibleSession, 'id'>>) => void;
  deleteSession: (sessionId: string) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  // New methods for iterative content
  addContentBlock: (sessionId: string, block: CrucibleContentBlock, parentBlockId?: string) => void;
  addTask: (task: CrucibleTask) => void;
  updateTask: (taskId: string, updates: Partial<Omit<CrucibleTask, 'id'>>) => void;
  removeTask: (taskId: string) => void;
}

export const useCrucibleStore = create<CrucibleState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      tasks: [], // Initialize tasks
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
      addTask: (task) => set(state => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      })),
      removeTask: (taskId) => set(state => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      })),
    }),
    {
      name: 'ai-notes-crucible-sessions',
      // Exclude 'tasks' from being persisted to localStorage
      partialize: (state) => {
        const { tasks, ...rest } = state;
        return rest;
      },
    }
  )
);