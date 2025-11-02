
import React, { useState, useEffect } from 'react';
import { Note, WikiEntry, WIKI_ROOT_ID, LoadingState } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import CpuChipIcon from '../icons/CpuChipIcon';

interface WikiStudioHomeProps {
    notes: Note[];
    wikis: WikiEntry[];
    wikiTopics: string[];
    isLoadingWikiTopics: boolean;
    onSelectNote: (note: Note) => void;
    onStartWithTopic: (topic: string) => void;
    onSelectWiki: (wiki: WikiEntry) => void;
    loadingState: LoadingState | null;
}

const WikiStudioHome: React.FC<WikiStudioHomeProps> = ({
    notes,
    wikis,
    wikiTopics,
    isLoadingWikiTopics,
    onSelectNote,
    onStartWithTopic,
    onSelectWiki,
    loadingState,
}) => {
    const topLevelWikis = wikis.filter(w => w.parentId === WIKI_ROOT_ID).sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
    const recentNotes = notes.slice(0, 5);
    const [customTopic, setCustomTopic] = useState('');
    const [isSubmittingCustomTopic, setIsSubmittingCustomTopic] = useState(false);

    useEffect(() => {
        if (loadingState === null) {
            setIsSubmittingCustomTopic(false);
        }
    }, [loadingState]);

    const handleCustomTopicSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customTopic.trim() && !loadingState) {
            setIsSubmittingCustomTopic(true);
            onStartWithTopic(customTopic.trim());
            setCustomTopic('');
        }
    };
    
    const isCustomTopicLoading = isSubmittingCustomTopic && loadingState?.type === 'explore';

    return (
        <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                {/* Main Header & Search */}
                <div className="text-center pt-8 pb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <BookOpenIcon className="w-8 h-8 text-indigo-500" />
                      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Infinite Wiki
                      </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Explore an endless web of interconnected ideas.</p>
                    
                    <form onSubmit={handleCustomTopicSubmit} className="max-w-xl mx-auto mt-8 flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="Explore any topic, idea, or concept..."
                            disabled={!!loadingState}
                            className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-full pl-5 pr-2 py-2 text-base focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!!loadingState || !customTopic.trim()}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-11 h-11 flex items-center justify-center"
                        >
                             {isCustomTopicLoading ? (
                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <PaperAirplaneIcon className="w-5 h-5" />
                            )}
                        </button>
                    </form>

                    <div className="max-w-xl mx-auto mt-6 text-center h-10">
                        {isLoadingWikiTopics ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : wikiTopics.length > 0 ? (
                            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 animate-in fade-in">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Or try:</span>
                                {wikiTopics.slice(0, 4).map((topic, index) => {
                                    const isLoading = loadingState?.type === 'explore' && loadingState.id === topic;
                                    return (
                                        <button 
                                            key={index} 
                                            onClick={() => onStartWithTopic(topic)}
                                            disabled={!!loadingState}
                                            className="px-3 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-full font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                            {topic}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Recent Content */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section>
                        <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">Continue Exploring</h2>
                        <div className="space-y-2">
                           {topLevelWikis.length > 0 ? (
                                topLevelWikis.map(wiki => (
                                    <button key={wiki.id} onClick={() => onSelectWiki(wiki)} className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                                        <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{wiki.term}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(wiki.createdAt).toLocaleDateString()}</p>
                                    </button>
                                ))
                           ) : (
                            <div className="text-center py-6 px-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-lg">
                                 <BookOpenIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">Your explored topics will appear here.</p>
                            </div>
                           )}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">Start from a Note</h2>
                        <div className="space-y-2">
                            {recentNotes.length > 0 ? (
                                recentNotes.map(note => {
                                    const isLoading = loadingState?.type === 'explore' && loadingState.id === note.id;
                                    return (
                                        <button key={note.id} onClick={() => onSelectNote(note)} disabled={!!loadingState} className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{note.title || 'Untitled Note'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                                            </div>
                                            {isLoading && <div className="ml-2 w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="text-center py-6 px-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-lg">
                                    <CpuChipIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Create a note to start an exploration.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WikiStudioHome;
