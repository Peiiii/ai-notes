import React, { useState, useEffect } from 'react';
import { Note, WikiEntry } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, title: string, content: string) => void;
  wikis: WikiEntry[];
  onViewWikiInStudio: (wikiId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
    note, 
    onUpdateNote,
    wikis,
    onViewWikiInStudio,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleBlur = () => {
    if (note) {
      if (note.title !== title || note.content !== content) {
        onUpdateNote(note.id, title, content);
      }
    }
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <div className="text-center">
            <h2 className="text-2xl font-semibold">Select a note</h2>
            <p>Or create a new one to get started.</p>
        </div>
      </div>
    );
  }
  
  const rootWikisFromThisNote = wikis.filter(w => w.sourceNoteId === note.id && w.parentId === null);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
      <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Note Title"
                  className="flex-1 text-3xl font-bold bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
          </div>
          <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              placeholder="Start writing..."
              className="flex-1 w-full bg-transparent text-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
          />
      </div>
      {rootWikisFromThisNote.length > 0 && (
          <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5"/>
                Explorations from this note
              </h3>
              <div className="space-y-2">
                  {rootWikisFromThisNote.map(wiki => (
                      <button 
                        key={wiki.id} 
                        onClick={() => onViewWikiInStudio(wiki.id)}
                        className="w-full text-left p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                          <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{wiki.term}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Started on {new Date(wiki.createdAt).toLocaleDateString()}</p>
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default NoteEditor;
