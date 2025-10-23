
import React, { useState, useEffect } from 'react';
import { Note } from '../types';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, title: string, content: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdateNote }) => {
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

  return (
    <div className="p-6 md:p-8 h-full flex flex-col bg-white dark:bg-slate-800/50">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Note Title"
        className="text-3xl font-bold bg-transparent focus:outline-none mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Start writing..."
        className="flex-1 w-full bg-transparent text-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
      />
    </div>
  );
};

export default NoteEditor;
