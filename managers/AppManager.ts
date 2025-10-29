import { useAppStore } from '../stores/appStore';
import { ViewMode, Note, WikiEntry, PulseReport } from '../types';

export class AppManager {
  setViewMode = (mode: ViewMode) => {
    useAppStore.setState({ viewMode: mode });
  }

  setActiveNoteId = (id: string | null) => {
    useAppStore.setState({ activeNoteId: id });
  }

  setInitialWikiHistory = (history: (Note | WikiEntry)[] | null) => {
    useAppStore.setState({ initialWikiHistory: history });
  }

  setViewingPulseReport = (report: PulseReport | null) => {
    useAppStore.setState({ viewingPulseReport: report });
  }

  setCommandToCreate = (commandName: string | null) => {
    useAppStore.setState({ commandToCreate: commandName });
  }
}
