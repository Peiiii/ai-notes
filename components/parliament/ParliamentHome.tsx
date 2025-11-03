import React, { useState } from 'react';
import { Note, ParliamentMode, ParliamentSession } from '../../types';
import { usePresenter } from '../../presenter';
import { useNotesStore } from '../../stores/notesStore';
import { useParliamentStore } from '../../stores/parliamentStore';
import UsersIcon from '../icons/UsersIcon';
import SparklesIcon from '../icons/SparklesIcon';
import ChatBubbleBottomCenterTextIcon from '../icons/ChatBubbleBottomCenterTextIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import TrashIcon from '../icons/TrashIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';

const ModeSelection: React.FC<{ onSelect: (mode: ParliamentMode) => void }> = ({ onSelect }) => (
    <div className="grid md:grid-cols-2 gap-8">
        <button onClick={() => onSelect('debate')} className="text-left p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all transform border border-transparent hover:border-indigo-500">
            <UsersIcon className="w-10 h-10 mb-3 text-indigo-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Debate Chamber</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">A pragmatist and a visionary AI debate a topic from opposing viewpoints.</p>
        </button>
        <button onClick={() => onSelect('podcast')} className="text-left p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all transform border border-transparent hover:border-purple-500">
            <ChatBubbleBottomCenterTextIcon className="w-10 h-10 mb-3 text-purple-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Podcast Studio</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">A host and an expert AI discuss a topic in an engaging, conversational format.</p>
        </button>
    </div>
);

const TopicStarter: React.FC<{ mode: ParliamentMode }> = ({ mode }) => {
  const presenter = usePresenter();
  const { notes } = useNotesStore();
  const { topics, isLoadingTopics, isGenerating } = useParliamentStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [customTopic, setCustomTopic] = useState('');

  const handleStart = (topic: string, noteId?: string) => {
    if (isGenerating) return;
    if (mode === 'debate') {
      presenter.parliamentManager.startDebate(topic, noteId);
    } else {
      presenter.parliamentManager.startPodcast(topic, noteId);
    }
  };

  const handleStartFromNote = () => {
    if (selectedNote) {
      const topic = `A discussion inspired by the note: "${selectedNote.title || 'Untitled'}"`;
      handleStart(topic, selectedNote.id);
    }
  };

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim() && !isGenerating) {
      handleStart(customTopic.trim());
      setCustomTopic('');
    }
  };

  const modeTitle = mode === 'debate' ? 'Start Debate' : 'Start Podcast';

  return (
    <div className="animate-in fade-in-50">
        <form onSubmit={handleCustomTopicSubmit} className="mb-10 max-w-xl mx-auto flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
            <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Or start with your own topic..."
                disabled={isGenerating}
                className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-full pl-5 pr-2 py-2 text-base focus:outline-none disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={!customTopic.trim() || isGenerating}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-sm font-semibold flex items-center"
            >
                <span>{modeTitle}</span>
                <PaperAirplaneIcon className="w-4 h-4 ml-2" />
            </button>
        </form>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mb-4">
                {notes.length > 0 ? (
                notes.map(note => (
                    <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    disabled={isGenerating}
                    className={`w-full text-left p-3 rounded-md transition-colors border-2 ${selectedNote?.id === note.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                    <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                    </button>
                ))
                ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Create a note to start a session from it.</p>
                )}
            </div>
            <button 
                onClick={handleStartFromNote} 
                disabled={!selectedNote || isGenerating} 
                className="w-full mt-auto bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
                {modeTitle} from Note
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
                    onClick={() => handleStart(topic)}
                    disabled={isGenerating}
                    className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <p className="font-semibold">{topic}</p>
                    </button>
                ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Create some notes, and we'll suggest topics here!</p>
            )}
            </div>
        </div>
    </div>
  );
}

const ParliamentHome: React.FC = () => {
  const [setupMode, setSetupMode] = useState<ParliamentMode | null>(null);
  const presenter = usePresenter();
  const sessions = useParliamentStore(state => state.sessions);

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="h-8">
            {setupMode && (
                <button onClick={() => setSetupMode(null)} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to modes</span>
                </button>
            )}
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
              <UsersIcon className="w-16 h-16 text-slate-600 dark:text-slate-300" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-400 dark:from-slate-300 dark:to-slate-500">
                Mind's Parliament
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {setupMode ? `Choose a starting point for your ${setupMode}.` : 'Revisit past sessions or start a new one.'}
          </p>
        </div>

        {!setupMode && sessions.length > 0 && (
           <section className="mb-12 animate-in fade-in-50">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Session History</h2>
                <div className="space-y-2">
                    {sessions.map(session => (
                        <div key={session.id} className="group w-full flex items-center gap-2 text-left p-3 pr-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500">
                            <button onClick={() => presenter.handleViewParliamentSession(session.id)} className="flex-1 flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    {session.mode === 'debate' ? <UsersIcon className="w-5 h-5 text-indigo-500"/> : <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-purple-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{session.topic}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} on {new Date(session.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); presenter.handleDeleteParliamentSession(session.id); }} 
                                className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-opacity flex-shrink-0"
                                title="Delete Session"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        )}

        <section className="mb-12">
            {!setupMode && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Start New Session</h2>
                </div>
            )}
             <div className="space-y-8">
                {!setupMode 
                    ? <ModeSelection onSelect={setSetupMode} /> 
                    : <TopicStarter mode={setupMode} />
                }
            </div>
        </section>

      </div>
    </div>
  );
};

export default ParliamentHome;