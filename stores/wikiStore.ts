
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WikiEntry } from '../types';

interface WikiState {
  wikis: WikiEntry[];
  wikiTopics: string[];
  isLoadingWikiTopics: boolean;
  activeWikiHistory: WikiEntry[];
}

export const useWikiStore = create<WikiState>()(
  persist(
    () => ({
      wikis: [],
      wikiTopics: [],
      isLoadingWikiTopics: false,
      activeWikiHistory: [],
    }),
    {
      name: 'ai-notes-wiki-storage',
      partialize: (state) => ({
        wikis: state.wikis,
        wikiTopics: state.wikiTopics,
        activeWikiHistory: state.activeWikiHistory,
      }),
    }
  )
);