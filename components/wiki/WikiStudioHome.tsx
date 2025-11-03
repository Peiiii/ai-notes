

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Note, WikiEntry, WIKI_ROOT_ID, Exploration } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import SparklesIcon from '../icons/SparklesIcon';
import MindMapIcon from '../icons/MindMapIcon';

interface WikiStudioHomeProps {
    notes: Note[];
    wikis: WikiEntry[];
    wikiTopics: string[];
    isLoadingWikiTopics: boolean;
    onSelectNote: (note: Note) => void;
    onStartWithTopic: (topic: string) => void;
    onSelectWiki: (wiki: WikiEntry) => void;
}

const WikiStudioHome: React.FC<WikiStudioHomeProps> = ({
    notes,
    wikis,
    wikiTopics,
    isLoadingWikiTopics,
    onSelectNote,
    onStartWithTopic,
    onSelectWiki,
}) => {
    const explorations = useAppStore(state => state.explorations);

    const topLevelWikis = wikis.filter(w => w.parentId === WIKI_ROOT_ID).sort((a,b) => b.createdAt - a.createdAt);
    const recentNotes = notes.slice(0, 6);
    const [customTopic, setCustomTopic] = useState('');
    
    const handleCustomTopicSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customTopic.trim()) {
            onStartWithTopic(customTopic.trim());
            setCustomTopic('');
        }
    };
    
    const isCustomTopicLoading = explorations.some(e => e.status === 'loading' && e.term === customTopic.trim());

    return (
        <div className="h-full flex flex-col px-6 md:px-8 pt-0 pb-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full">
                {/* Main Header & Search */}
                <div className="text-center pt-4 pb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <BookOpenIcon className="w-8 h-8 text-indigo-500" />
                      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Infinite Wiki
                      </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">An endless web of interconnected ideas, born from your notes.</p>
                    
                    <form onSubmit={handleCustomTopicSubmit} className="max-w-xl mx-auto mt-8 flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="Explore any topic, idea, or concept..."
                            className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-full pl-5 pr-2 py-2 text-base focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!customTopic.trim()}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-11 h-11 flex items-center justify-center"
                        >
                             {isCustomTopicLoading ? (
                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <PaperAirplaneIcon className="w-5 h-5" />
                            )}
                        </button>
                    </form>

                    {/* AI Suggestions */}
                    <div className="max-w-2xl mx-auto mt-6 text-center">
                        <div className="min-h-[40px]">
                            {isLoadingWikiTopics ? (
                                <div className="flex justify-center items-center h-full pt-4">
                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : wikiTopics.length > 0 ? (
                                <div className="animate-in fade-in">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Or try one of these suggestions:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {wikiTopics.map((topic, index) => {
                                            const isLoading = explorations.some(e => e.status === 'loading' && e.term === topic);
                                            return (
                                                <button 
                                                    key={index} 
                                                    onClick={() => onStartWithTopic(topic)}
                                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-full font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                                                    {isLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                                    {topic}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                 <p className="text-sm text-slate-500 dark:text-slate-400">Create some notes, and AI suggestions will appear here.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Start from Note */}
                    <main className="lg:col-span-2">
                         <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentNotes.length > 0 ? (
                                recentNotes.map(note => {
                                    const isLoading = explorations.some(e => e.status === 'loading' && e.term === (note.title || 'Exploration from Note'));
                                    return (
                                        <div key={note.id} className="group relative p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500">
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{note.title || 'Untitled Note'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 h-10 overflow-hidden">{note.content || 'No content'}</p>
                                            </div>
                                            <button 
                                                onClick={() => onSelectNote(note)}
                                                className="absolute bottom-4 right-4 flex items-center justify-center gap-2 h-8 px-3 text-xs font-semibold text-white bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50"
                                            >
                                                {isLoading ? (
                                                    <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                                ) : "Explore"}
                                            </button>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="md:col-span-2 text-center py-10 px-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-lg">
                                    <CpuChipIcon className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                                    <p className="font-semibold text-slate-600 dark:text-slate-300">No notes yet</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Create a note to start an exploration.</p>
                                </div>
                            )}
                         </div>
                    </main>
                    
                    {/* Sidebar */}
                    <aside>
                        {/* Continue Exploring */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Continue Exploring</h2>
                            <div className="space-y-2">
                            {topLevelWikis.length > 0 ? (
                                    topLevelWikis.map(wiki => {
                                        const childCount = wikis.filter(w => w.parentId === wiki.id).length;
                                        return (
                                            <button key={wiki.id} onClick={() => onSelectWiki(wiki)} className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md flex items-center justify-between">
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{wiki.term}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(wiki.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 ml-2">
                                                    <MindMapIcon className="w-3 h-3" />
                                                    <span>{childCount}</span>
                                                </div>
                                            </button>
                                        )
                                    })
                            ) : (
                                <div className="text-center py-6 px-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-lg">
                                    <BookOpenIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Your explored topics will appear here.</p>
                                </div>
                            )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default WikiStudioHome;