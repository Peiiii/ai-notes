import React from 'react';
import { Note, WikiEntry } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import SparklesIcon from '../icons/SparklesIcon';

interface WikiStudioHomeProps {
  notes: Note[];
  wikis: WikiEntry[];
  aiTopics: string[];
  isLoadingTopics: boolean;
  onStartWithNote: (note: Note) => void;
  onStartWithTopic: (topic: string) => void;
  onSelectWiki: (wiki: WikiEntry) => void;
  loadingState: { type: 'topic'; id: string } | null;
}

const WikiStudioHome: React.FC<WikiStudioHomeProps> = ({
  notes,
  wikis,
  aiTopics,
  isLoadingTopics,
  onStartWithNote,
  onStartWithTopic,
  onSelectWiki,
  loadingState,
}) => {
  const rootWikis = wikis.filter(w => w.parentId === null).sort((a,b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Infinite Wiki</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Start a journey of discovery. Begin with one of your notes or an AI-suggested topic.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Continue Exploring</h2>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">From a Note</h3>
                {notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map(note => (
                      <button key={note.id} onClick={() => onStartWithNote(note)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any notes yet. Create one to start an exploration.</p>
                )}
              </div>

              {rootWikis.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">From an Existing Topic</h3>
                  <div className="space-y-2">
                    {rootWikis.map(wiki => (
                      <button key={wiki.id} onClick={() => onSelectWiki(wiki)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <p className="font-semibold truncate">{wiki.term}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(wiki.createdAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              Start a New Topic
            </h2>
             {isLoadingTopics ? (
               <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
               </div>
             ) : aiTopics.length > 0 ? (
               <div className="space-y-2">
                  {aiTopics.map((topic, index) => {
                    const isLoading = loadingState?.type === 'topic' && loadingState.id === topic;
                    return (
                      <button
                          key={index}
                          onClick={() => onStartWithTopic(topic)}
                          disabled={!!loadingState}
                          className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <p className="font-semibold">{topic}</p>
                          {isLoading && (
                              <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                      </button>
                    )
                  })}
               </div>
             ) : (
               <p className="text-sm text-slate-500 dark:text-slate-400">Create some notes, and we'll suggest topics for you here!</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiStudioHome;
