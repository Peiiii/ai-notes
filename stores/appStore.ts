
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewMode, Note, WikiEntry, PulseReport } from '../types';

interface AppState {
  viewMode: ViewMode;
  activeNoteId: string | null;
  isChatSidebarCollapsed: boolean;
  // Fix: Changed type to only allow WikiEntry[] to match component props.
  initialWikiHistory: WikiEntry[] | null;
  viewingPulseReport: PulseReport | null;
  commandToCreate: string | null;
  activeModal: 'addAgents' | 'clearChatConfirm' | 'renameChat' | null;
}

export const useAppStore = create<AppState>()(
  persist(
    () => ({
      viewMode: 'editor',
      activeNoteId: null,
      isChatSidebarCollapsed: false,
      initialWikiHistory: null,
      viewingPulseReport: null,
      commandToCreate: null,
      activeModal: null,
    }),
    {
      name: 'ai-notes-app-state',
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeNoteId: state.activeNoteId,
        isChatSidebarCollapsed: state.isChatSidebarCollapsed,
      }),
    }
  )
);