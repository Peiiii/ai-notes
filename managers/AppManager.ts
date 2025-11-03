
import { useAppStore } from '../stores/appStore';
import { ViewMode, Note, WikiEntry, PulseReport, Exploration, ExplorationPanelMode } from '../types';

export class AppManager {
  setViewMode = (mode: ViewMode) => {
    useAppStore.setState({ viewMode: mode });
  }

  setActiveNoteId = (id: string | null) => {
    useAppStore.setState({ activeNoteId: id });
  }

  // Fix: Changed type to only allow WikiEntry[] to match the updated app state.
  setInitialWikiHistory = (history: WikiEntry[] | null) => {
    useAppStore.setState({ initialWikiHistory: history });
  }

  setViewingPulseReport = (report: PulseReport | null) => {
    useAppStore.setState({ viewingPulseReport: report });
  }

  setCommandToCreate = (commandName: string | null) => {
    useAppStore.setState({ commandToCreate: commandName });
  }

  setActiveModal = (modal: ReturnType<typeof useAppStore.getState>['activeModal']) => {
    useAppStore.setState({ activeModal: modal });
  }

  setChatSidebarCollapsed = (isCollapsed: boolean) => {
    useAppStore.setState({ isChatSidebarCollapsed: isCollapsed });
  }

  setMainSidebarCollapsed = (isCollapsed: boolean) => {
    useAppStore.setState({ isMainSidebarCollapsed: isCollapsed });
  };

  setPreviewingNoteId = (id: string | null) => {
    useAppStore.setState({ previewingNoteId: id });
  }
  
  setIsAgentHubOpen = (isOpen: boolean) => {
    useAppStore.setState({ isAgentHubOpen: isOpen });
  }

  setAgentToEditId = (id: string | null) => {
    useAppStore.setState({ agentToEditId: id });
  }

  // --- Exploration Panel Management ---
  setExplorationPanelMode = (mode: ExplorationPanelMode) => {
    useAppStore.setState({ explorationPanelMode: mode });
  }

  addExploration = (term: string): string => {
    const id = crypto.randomUUID();
    const newExploration: Exploration = {
      id,
      term,
      status: 'loading',
    };
    useAppStore.setState(state => ({ explorations: [newExploration, ...state.explorations] }));
    return id;
  }

  updateExploration = (id: string, updates: Partial<Omit<Exploration, 'id'>>) => {
    useAppStore.setState(state => ({
      explorations: state.explorations.map(exp => 
        exp.id === id ? { ...exp, ...updates } : exp
      )
    }));
  }

  removeExploration = (id: string) => {
    useAppStore.setState(state => ({
      explorations: state.explorations.filter(exp => exp.id !== id)
    }));
  }

  clearCompletedExplorations = () => {
    useAppStore.setState(state => ({
      explorations: state.explorations.filter(exp => exp.status === 'loading')
    }));
  }
}