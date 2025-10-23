import React from 'react';
import { Note } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

type ViewMode = 'editor' | 'studio';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  onShowStudio: () => void;
  isLoadingAI: boolean;
  viewMode: ViewMode;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onShowStudio,
  isLoadingAI,
  viewMode,
}) => {
  const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  const isStudioActive = viewMode === 'studio';

  return (
    <div className="h-full bg-slate-100 dark:bg-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Notes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your intelligent companion</p>
      </div>
      <div className="p-4 flex items-center gap-2">
        <button
          onClick={onNewNote}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          New Note
        </button>
        <button
          onClick={onShowStudio}
          className={`flex flex-1 items-center justify-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isStudioActive 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          <span>Studio</span>
          <ChevronRightIcon className="w-4 h-4" />
          {isLoadingAI && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-1"></div>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2">
          {sortedNotes.map((note) => {
            const hasTitle = !!note.title;
            const displayTitle = hasTitle ? note.title : (note.content || 'New Note');
            const displaySubtitle = hasTitle ? (note.content || 'No content') : new Date(note.createdAt).toLocaleDateString();

            return (
              <li key={note.id}>
                <button
                  onClick={() => onSelectNote(note.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    note.id === activeNoteId && viewMode === 'editor'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                      <h3 className={`font-semibold truncate ${note.id === activeNoteId && viewMode === 'editor' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {displayTitle}
                      </h3>
                      <p className={`text-xs truncate ${note.id === activeNoteId && viewMode === 'editor' ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {displaySubtitle}
                      </p>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                        note.id === activeNoteId && viewMode === 'editor'
                          ? 'text-blue-200 hover:bg-white/20 hover:text-white'
                          : 'text-slate-500 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400'
                      }`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default NoteList;