import React from 'react';
import { useNotesStore } from '../../stores/notesStore';
import XMarkIcon from '../icons/XMarkIcon';
import ArrowTopRightOnSquareIcon from '../icons/ArrowTopRightOnSquareIcon';

interface NotePreviewSidebarProps {
  noteId: string;
  onClose: () => void;
  onGoToNote: (noteId: string) => void;
}

const NotePreviewSidebar: React.FC<NotePreviewSidebarProps> = ({ noteId, onClose, onGoToNote }) => {
  const note = useNotesStore(state => state.notes.find(n => n.id === noteId));

  if (!note) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md bg-white dark:bg-slate-800 shadow-2xl z-40 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-10 duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 truncate pr-4">{note.title || 'Untitled Note'}</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onGoToNote(note.id)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Open in editor"
            >
                <ArrowTopRightOnSquareIcon className="w-5 h-5"/>
            </button>
            <button 
                onClick={onClose} 
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Close preview"
            >
                <XMarkIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap break-words">
            {note.content}
        </div>
      </div>
    </div>
  );
};

export default NotePreviewSidebar;