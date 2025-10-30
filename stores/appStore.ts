import { create } from 'zustand';
import { ViewMode, Note, WikiEntry, PulseReport } from '../types';

interface AppState {
  viewMode: ViewMode;
  activeNoteId: string | null;
  // Fix: Changed type to only allow WikiEntry[] to match component props.
  initialWikiHistory: WikiEntry[] | null;
  viewingPulseReport: PulseReport | null;
  commandToCreate: string | null;
}

export const useAppStore = create<AppState>(() => ({
  viewMode: 'editor',
  activeNoteId: null,
  initialWikiHistory: null,
  viewingPulseReport: null,
  commandToCreate: null,
}));
