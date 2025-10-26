
import React, { useState } from 'react';
import { Note } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import SparklesIcon from '../icons/SparklesIcon';

interface ParliamentHomeProps {
  notes: Note[];
  topics: string[];
  isLoadingTopics: boolean;
  onStartDebate: (topic: string, noteId?: string) => void;
}

const ParliamentHome: React.FC<ParliamentHomeProps> = ({
  notes,
  topics,
  isLoadingTopics,
  onStartDebate,
}) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleStartFromNote = () => {
    if (selectedNote) {
      const topic = `A debate inspired by the note: "${selectedNote.title || 'Untitled'}"`;
      onStartDebate(topic, selectedNote.id);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Parliament</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Explore your ideas from multiple perspectives through automated AI debates.</p>
        </div>
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mb-4">
                {notes.length > 0 ? (
                  notes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`w-full text-left p-3 rounded-md transition-colors border-2 ${selectedNote?.id === note.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Create a note to start a debate from it.</p>
                )}
              </div>
              <button 
                onClick={handleStartFromNote} 
                disabled={!selectedNote} 
                className="w-full mt-auto bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                Debate This Note
              </button>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                Start with a Suggested Topic
              </h2>
              {isLoadingTopics ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : topics.length > 0 ? (
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => onStartDebate(topic)}
                      className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <p className="font-semibold">{topic}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Create some notes, and we'll suggest debate topics here!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParliamentHome;
