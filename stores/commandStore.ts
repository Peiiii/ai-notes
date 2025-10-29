import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Command, defaultCommands } from '../commands';

interface CommandState {
  customCommands: Command[];
  addCommand: (command: Omit<Command, 'isCustom'>) => void;
  getCommands: () => Command[];
}

export const useCommandStore = create<CommandState>()(
  persist(
    (set, get) => ({
      customCommands: [],
      addCommand: (command) => {
        const newCommand: Command = { ...command, isCustom: true };
        set((state) => ({ customCommands: [...state.customCommands, newCommand] }));
      },
      // Getter is not part of state, so it's defined outside the persisted object
      getCommands: () => [...defaultCommands, ...get().customCommands],
    }),
    {
      name: 'ai-notes-custom-commands',
      partialize: (state) => ({ customCommands: state.customCommands }),
    }
  )
);
