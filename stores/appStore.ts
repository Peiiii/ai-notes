
import { create } from 'zustand';
import { ViewMode, Note, WikiEntry, PulseReport } from '../types';

interface AppState {
  viewMode: ViewMode;
  activeNoteId: string | null;
  initialWikiHistory: (Note | WikiEntry)[] | null;
  viewingPulseReport: PulseReport | null;
}

export const useAppStore = create<AppState>(() => ({
  viewMode: 'editor',
  activeNoteId: null,
  initialWikiHistory: null,
  viewingPulseReport: null,
}));
