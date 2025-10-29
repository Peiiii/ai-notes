import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AISummary, Todo, PulseReport, MindMapData } from '../types';

interface StudioState {
  aiSummary: AISummary | null;
  myTodos: Todo[];
  notesHashAtLastSummary: string | null;
  isLoadingAI: boolean;
  isLoadingPulse: boolean;
  lastPulseTimestamp: number | null;
  pulseReports: PulseReport[];
  mindMapData: MindMapData | null;
  isLoadingMindMap: boolean;
  notesHashAtLastMindMap: string | null;
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
      mindMapData: null,
      isLoadingMindMap: false,
      notesHashAtLastMindMap: null,
    }),
    {
      name: 'ai-notes-studio-storage',
      partialize: (state) => ({ 
        aiSummary: state.aiSummary,
        myTodos: state.myTodos,
        notesHashAtLastSummary: state.notesHashAtLastSummary,
        lastPulseTimestamp: state.lastPulseTimestamp,
        pulseReports: state.pulseReports,
        mindMapData: state.mindMapData,
        notesHashAtLastMindMap: state.notesHashAtLastMindMap,
      }),
    }
  )
);