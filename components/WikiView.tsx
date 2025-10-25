import React, { useState } from 'react';
import { WikiEntry } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BookOpenIcon from './icons/BookOpenIcon';

declare global {
    interface Window {
        marked: {
            parse: (markdown: string) => string;
        };
    }
}

interface WikiViewProps {
    wikis: WikiEntry[];
}

const WikiView: React.FC<WikiViewProps> = ({ wikis }) => {
    const [viewingWiki, setViewingWiki] = useState<WikiEntry | null>(null);

    if (viewingWiki) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button onClick={() => setViewingWiki(null)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Wiki List
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">{viewingWiki.term}</h2>
                    <div
                        className="prose prose-sm prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: window.marked.parse(viewingWiki.content) }}
                    ></div>
                </div>
            </div>
        );
    }
    
    const sortedWikis = [...wikis].sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 overflow-y-auto p-4">
                 {sortedWikis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                        <BookOpenIcon className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-500" />
                        <h2 className="text-lg font-semibold">Note Wiki</h2>
                        <p className="max-w-xs mt-1 text-sm">Select text in your note to generate a wiki entry and dive deeper into any topic.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {sortedWikis.map(wiki => (
                            <li key={wiki.id}>
                                <button
                                    onClick={() => setViewingWiki(wiki)}
                                    className="w-full text-left p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">{wiki.term}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Created on {new Date(wiki.createdAt).toLocaleDateString()}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default WikiView;
