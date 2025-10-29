import React from 'react';
import { Command } from '../../commands';
import PlusCircleIcon from '../icons/PlusCircleIcon';

interface CommandPaletteProps {
    commands: Command[];
    query: string;
    selectedIndex: number;
    onSelect: (commandName: string) => void;
    onHover: (index: number) => void;
    onCreateCommand: (commandName: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, query, selectedIndex, onSelect, onHover, onCreateCommand }) => {
    const showCreateButton = commands.length === 0 && query.length > 0;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 pb-1">COMMANDS</p>
            <ul>
                {commands.map((command, index) => (
                    <li key={command.name}>
                        <button
                            onClick={() => onSelect(command.name)}
                            onMouseEnter={() => onHover(index)}
                            className={`w-full text-left p-2 rounded-md flex items-center justify-between ${selectedIndex === index ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        >
                            <div>
                                <span className={`font-semibold ${selectedIndex === index ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-100'}`}>
                                    /{command.name}
                                </span>
                                <span className={`ml-2 font-mono text-xs ${selectedIndex === index ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {command.params}
                                </span>
                            </div>
                            <p className={`text-xs ${selectedIndex === index ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                {command.description}
                            </p>
                        </button>
                    </li>
                ))}
                 {showCreateButton && (
                    <li>
                        <button
                            onClick={() => onCreateCommand(query)}
                            onMouseEnter={() => onHover(0)}
                            className={`w-full text-left p-2 rounded-md flex items-center gap-2 ${selectedIndex === 0 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        >
                           <PlusCircleIcon className={`w-5 h-5 ${selectedIndex === 0 ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                           <div>
                                <span className={`font-semibold ${selectedIndex === 0 ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-100'}`}>
                                    Create command "/{query}"
                                </span>
                                <p className={`text-xs ${selectedIndex === 0 ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                    Teach the AI a new custom skill.
                                </p>
                           </div>
                        </button>
                    </li>
                )}
            </ul>
        </div>
    );
};

export default CommandPalette;
