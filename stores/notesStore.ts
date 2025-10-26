
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from '../types';

interface NotesState {
  notes: Note[];
  generatingTitleIds: Set<string>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    () => ({
      notes: [],
      generatingTitleIds: new Set(),
    }),
    {
      name: 'ai-notes-app',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              generatingTitleIds: new Set(state.generatingTitleIds || []),
            },
          };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({
            state: {
              ...newValue.state,
              generatingTitleIds: Array.from(newValue.state.generatingTitleIds),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
