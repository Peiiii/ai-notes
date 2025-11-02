
import { useAppStore } from '../stores/appStore';
import { ViewMode, Note, WikiEntry, PulseReport } from '../types';

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

  setPreviewingNoteId = (id: string | null) => {
    useAppStore.setState({ previewingNoteId: id });
  }
}