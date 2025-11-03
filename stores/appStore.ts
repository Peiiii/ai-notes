
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewMode, Note, WikiEntry, PulseReport, Exploration, ExplorationPanelMode } from '../types';

interface AppState {
  viewMode: ViewMode;
  activeNoteId: string | null;
  isChatSidebarCollapsed: boolean;
  isMainSidebarCollapsed: boolean;
  // Fix: Changed type to only allow WikiEntry[] to match component props.
  initialWikiHistory: WikiEntry[] | null;
  viewingPulseReport: PulseReport | null;
  commandToCreate: string | null;
  activeModal: 'addAgents' | 'clearChatConfirm' | 'renameChat' | null;
  previewingNoteId: string | null;
  isAgentHubOpen: boolean;
  agentToEditId: string | null;
  explorations: Exploration[];
  explorationPanelMode: ExplorationPanelMode;
  hasUsedExploration: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      viewMode: 'editor',
      activeNoteId: null,
      isChatSidebarCollapsed: false,
      isMainSidebarCollapsed: false,
      initialWikiHistory: null,
      viewingPulseReport: null,
      commandToCreate: null,
      activeModal: null,
      previewingNoteId: null,
      isAgentHubOpen: false,
      agentToEditId: null,
      explorations: [],
      explorationPanelMode: 'tray',
      hasUsedExploration: false,
    }),
    {
      name: 'ai-notes-app-state',
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeNoteId: state.activeNoteId,
        isChatSidebarCollapsed: state.isChatSidebarCollapsed,
        isMainSidebarCollapsed: state.isMainSidebarCollapsed,
        explorationPanelMode: state.explorationPanelMode,
        hasUsedExploration: state.hasUsedExploration,
      }),
    }
  )
);
