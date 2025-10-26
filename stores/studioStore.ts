
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AISummary, Todo, PulseReport } from '../types';

interface StudioState {
  aiSummary: AISummary | null;
  myTodos: Todo[];
  notesHashAtLastSummary: string | null;
  isLoadingAI: boolean;
  isLoadingPulse: boolean;
  lastPulseTimestamp: number | null;
  pulseReports: PulseReport[];
}

export const useStudioStore = create<StudioState>()(
  persist(
    () => ({
      aiSummary: null,
      myTodos: [],
      notesHashAtLastSummary: null,
      isLoadingAI: false,
      isLoadingPulse: false,
      lastPulseTimestamp: null,
      pulseReports: [],
    }),
    {
      name: 'ai-notes-studio-storage',
      partialize: (state) => ({ 
        aiSummary: state.aiSummary,
        myTodos: state.myTodos,
        notesHashAtLastSummary: state.notesHashAtLastSummary,
        lastPulseTimestamp: state.lastPulseTimestamp,
        pulseReports: state.pulseReports,
      }),
    }
  )
);
