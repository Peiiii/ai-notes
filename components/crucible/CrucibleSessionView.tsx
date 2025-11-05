import React, { useMemo, useState } from 'react';
import { usePresenter } from '../../presenter';
import { useCrucibleStore } from '../../stores/crucibleStore';
import { CrucibleStoryStructure, CrucibleTask } from '../../types';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import XMarkIcon from '../icons/XMarkIcon';
import SparklesIcon from '../icons-material/SparklesIcon';
import UsersIcon from '../icons/UsersIcon';
import PencilIcon from '../icons/PencilIcon';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import GlobeAltIcon from '../icons/GlobeAltIcon';
import TextSelectionPopup from '../ui/TextSelectionPopup';
import ExpansionPopup from './ExpansionPopup';
// Fix: Remove unused import for CrucibleTaskTray, which is not a module.
import { ExpansionSidebar } from './ExpansionSidebar';

// --- Brainstorming Phase Component ---
const BrainstormingPhase: React.FC<{ session: NonNullable<ReturnType<typeof useCrucibleStore>['sessions'][0]> }> = ({ session }) => {
    const presenter = usePresenter();
    const [customThought, setCustomThought] = useState('');

    const handleToggleReactorTerm = (term: string) => presenter.crucibleManager.toggleReactorTerm(session.id, term);

    const handleAddCustomThought = (e: React.FormEvent) => {
        e.preventDefault();
        if (customThought.trim()) {
            presenter.crucibleManager.addCustomThought(session.id, customThought.trim());
            setCustomThought('');
        }
    };
    
    const isGenerating = session.isLoading === 'story';

    return (
        <>
            {/* Divergent Thoughts */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">1. Brainstorm Concepts</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click a concept to add it to the reactor. Hover and click the ✨ to expand on an idea.</p>
                <div className="flex flex-wrap gap-3">
                    {session.divergentThoughts.map((thought) => {
                        const isInReactor = session.reactorTerms.includes(thought);
                        return (
                            <div key={thought} className="relative group">
                                <button 
                                    onClick={() => handleToggleReactorTerm(thought)}
                                    className={`pl-4 pr-5 py-2 rounded-full font-medium text-sm border-2 transition-all duration-200 ${
                                        isInReactor
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                                        : 'bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500'
                                    }`}
                                >
                                    {thought}
                                </button>
                                <button
                                    onClick={() => presenter.crucibleManager.expandSingleThought(session.id, thought)}
                                    className="absolute top-1/2 -right-1 -translate-y-1/2 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    title={`Expand "${thought}"`}
                                >
                                    <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                 <form onSubmit={handleAddCustomThought} className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={customThought}
                        onChange={(e) => setCustomThought(e.target.value)}
                        placeholder="Add your own concept..."
                        className="flex-1 bg-white dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600">Add</button>
                </form>
            </div>
            
            {/* Reactor */}
            <div className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">2. Load the Reactor</h2>
                <div className="min-h-[80px] p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-2 items-center border border-slate-200 dark:border-slate-700">
                    {session.reactorTerms.length > 0 ? session.reactorTerms.map(term => (
                        <div key={term} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-in fade-in zoom-in-95">
                            <span>{term}</span>
                            <button onClick={() => handleToggleReactorTerm(term)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )) : <p className="text-sm text-slate-400 dark:text-slate-500">Click concepts above to add them here.</p>}
                </div>
            </div>

            {/* Generate Button */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => presenter.crucibleManager.generateInitialStructure(session.id)}
                    disabled={session.reactorTerms.length === 0 || isGenerating}
                    className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                    {isGenerating ? (
                        <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div><span>Generating...</span></>
                    ) : (
                        <><SparklesIcon className="w-5 h-5" />Generate Initial Structure</>
                    )}
                </button>
            </div>
        </>
    );
};


// --- Writing Flow Phase Component ---
const WritingFlowPhase: React.FC<{ session: NonNullable<ReturnType<typeof useCrucibleStore>['sessions'][0]> }> = ({ session }) => {
    const presenter = usePresenter();
    
    return (
        <div className="space-y-4">
            {session.contentBlocks.map(block => (
                <div key={block.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <TextSelectionPopup
                        renderPopupContent={({ text, close }) => (
                            <ExpansionPopup
                                triggerText={text}
                                onGenerate={(prompt) => {
                                    presenter.crucibleManager.startExpansion(session.id, block.id, text, prompt);
                                    close();
                                }}
                            />
                        )}
                    >
                        {block.type === 'structure' ? (
                            <StoryStructureDisplay structure={block.content as CrucibleStoryStructure} />
                        ) : (
                            <MarkdownRenderer content={block.content as string} />
                        )}
                    </TextSelectionPopup>
                </div>
            ))}
        </div>
    );
};

// --- Main Session View ---
const CrucibleSessionView: React.FC = () => {
    const presenter = usePresenter();
    const { sessions, activeSessionId } = useCrucibleStore();
    const session = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
    
    if (!session) return null;

    const showBrainstorming = !session.contentBlocks || session.contentBlocks.length === 0;

    return (
        <div className="h-full flex">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto w-full animate-in fade-in">
                    <button onClick={() => presenter.crucibleManager.viewSession(null)} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6">
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to History
                    </button>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Initial Concept</h2>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">{session.topic}</h1>
                    
                    {session.isLoading === 'thoughts' ? (
                        <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div></div>
                    ) : showBrainstorming ? (
                       <BrainstormingPhase session={session} />
                    ) : (
                       <WritingFlowPhase session={session} />
                    )}
                </div>
            </div>
            {showBrainstorming && <ExpansionSidebar session={session} />}
        </div>
    );
};

// --- Helper Display Component for Story Structure ---
const StoryStructureDisplay: React.FC<{ structure: CrucibleStoryStructure }> = ({ structure }) => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{structure.title}</h2>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400 italic">{structure.logline}</p>
            </div>

            <div>
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><GlobeAltIcon className="w-6 h-6 text-indigo-500"/>Worldview</h3>
                <div className="mt-4 prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownRenderer content={structure.worldview} />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><UsersIcon className="w-6 h-6 text-indigo-500"/>Characters</h3>
                <div className="space-y-4">
                    {structure.characters.map(char => (
                        <div key={char.name}>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{char.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{char.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><PencilIcon className="w-6 h-6 text-indigo-500"/>Outline</h3>
                <div className="space-y-6">
                    {[structure.outline.act_1, structure.outline.act_2, structure.outline.act_3].map((act, index) => (
                        <div key={index}>
                            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Act {index + 1}: {act.title}</h4>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {act.plot_points.map((point, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300">{point}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default CrucibleSessionView;