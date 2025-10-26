import React from 'react';
import { Note, WikiEntry, WIKI_ROOT_ID, LoadingState } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import SparklesIcon from '../icons/SparklesIcon';

interface WikiStudioHomeProps {
    notes: Note[];
    wikis: WikiEntry[];
    aiTopics: string[];
    isLoadingTopics: boolean;
    onSelectNote: (note: Note) => void;
    onStartWithTopic: (topic: string) => void;
    onSelectWiki: (wiki: WikiEntry) => void;
    loadingState: LoadingState | null;
}

const WikiStudioHome: React.FC<WikiStudioHomeProps> = ({
    notes,
    wikis,
    aiTopics,
    isLoadingTopics,
    onSelectNote,
    onStartWithTopic,
    onSelectWiki,
    loadingState,
}) => {
    const topLevelWikis = wikis.filter(w => w.parentId === WIKI_ROOT_ID).sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                <div className="text-center mb-12">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Infinite Wiki</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Start a journey of discovery. Begin with one of your notes or an AI-suggested topic.</p>
                </div>
                <div className="space-y-8">
                    {topLevelWikis.length > 0 && (
                        <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Continue Exploring</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {topLevelWikis.map(wiki => (
                                    <button key={wiki.id} onClick={() => onSelectWiki(wiki)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        <p className="font-semibold truncate">{wiki.term}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(wiki.createdAt).toLocaleDateString()}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm flex flex-col">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                                {notes.length > 0 ? (
                                    notes.map(note => {
                                        const isLoading = loadingState?.type === 'explore' && loadingState.id === note.id;
                                        return (
                                            <button key={note.id} onClick={() => onSelectNote(note)} disabled={!!loadingState} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                                <div className="flex-1 overflow-hidden">
                                                  <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                                                </div>
                                                {isLoading && <div className="ml-2 w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any notes yet. Create one to start an exploration.</p>
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
                                        const isLoading = loadingState?.type === 'explore' && loadingState.id === topic;
                                        return (
                                            <button key={index} onClick={() => onStartWithTopic(topic)} disabled={!!loadingState} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                                <p className="font-semibold">{topic}</p>
                                                {isLoading && <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
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
        </div>
    );
};

export default WikiStudioHome;
