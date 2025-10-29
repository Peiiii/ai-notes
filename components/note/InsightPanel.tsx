import React from 'react';
import { Insight, Note } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import CheckIcon from '../icons/CheckIcon';
import LightbulbIcon from '../icons/LightbulbIcon';

interface InsightPanelProps {
  note: Note | null;
  insights: Insight[];
  isLoading: boolean;
  onAdoptTodo: (task: string) => void;
  onCreateWiki: (term: string) => void;
  onSelectNote: (noteId: string) => void;
}

const InsightCard: React.FC<{ 
    insight: Insight; 
    onAdoptTodo: (task: string) => void; 
    onCreateWiki: (term: string) => void; 
    onSelectNote: (noteId: string) => void; 
}> = ({ insight, onAdoptTodo, onCreateWiki, onSelectNote }) => {
    
    const iconMap: Record<Insight['type'], React.ReactElement> = {
        related_note: <BookOpenIcon className="w-5 h-5 text-sky-500" />,
        action_item: <CheckIcon className="w-5 h-5 text-green-500" />,
        wiki_concept: <LightbulbIcon className="w-5 h-5 text-purple-500" />,
    };

    const handleAction = () => {
        if (insight.type === 'action_item' && insight.content) {
            onAdoptTodo(insight.content);
        } else if (insight.type === 'wiki_concept' && insight.content) {
            onCreateWiki(insight.content);
        } else if (insight.type === 'related_note' && insight.sourceNoteId) {
            onSelectNote(insight.sourceNoteId);
        }
    };
    
    const actionLabel: Record<Insight['type'], string> = {
        related_note: 'View Note',
        action_item: 'Add to To-Do',
        wiki_concept: 'Create Wiki',
    };
    
    return (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{iconMap[insight.type]}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{insight.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{insight.content}</p>
                </div>
                { (insight.type !== 'action_item' || insight.content) &&
                    <button onClick={handleAction} title={actionLabel[insight.type]} className="p-1 text-slate-400 hover:text-indigo-500 transition-colors">
                        <PlusCircleIcon className="w-6 h-6" />
                    </button>
                }
            </div>
        </div>
    );
};

const InsightPanel: React.FC<InsightPanelProps> = ({ note, insights, isLoading, onAdoptTodo, onCreateWiki, onSelectNote }) => {
    return (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <div className="p-4 space-y-3">
                {isLoading && (
                    <div className="flex items-center justify-center pt-8">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {!isLoading && insights.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-slate-400 pt-8 px-4">
                        <LightbulbIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2"/>
                        <p className="text-sm">As you write, the AI will proactively surface related notes and suggest actions here.</p>
                    </div>
                )}
                {!isLoading && insights.map(insight => (
                    <InsightCard 
                        key={insight.id} 
                        insight={insight} 
                        onAdoptTodo={onAdoptTodo} 
                        onCreateWiki={onCreateWiki} 
                        onSelectNote={onSelectNote}
                    />
                ))}
            </div>
        </div>
    );
};

export default InsightPanel;