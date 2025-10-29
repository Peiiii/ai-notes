import { useCommandStore } from '../stores/commandStore';
import { Command } from '../commands';

export class CommandManager {
  createCommand = (commandData: Omit<Command, 'isCustom'>): boolean => {
    const { name, description, definition } = commandData;
    if (!name || !description || !definition) {
      console.error("Cannot create command: missing data.");
      return false;
    }

    const existingCommands = useCommandStore.getState().getCommands();
    if (existingCommands.some(c => c.name === name.trim())) {
      alert(`Command "/${name.trim()}" already exists.`);
      return false;
    }
    
    useCommandStore.getState().addCommand(commandData);
    return true;
  }
}
