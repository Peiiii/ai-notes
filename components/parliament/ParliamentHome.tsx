
import React, { useState } from 'react';
import { Note, ParliamentMode } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import SparklesIcon from '../icons/SparklesIcon';
import ChatBubbleBottomCenterTextIcon from '../icons/ChatBubbleBottomCenterTextIcon';

interface ParliamentHomeProps {
  notes: Note[];
  topics: string[];
  isLoadingTopics: boolean;
  onStartDebate: (topic: string, noteId?: string) => void;
  onStartPodcast: (topic: string, noteId?: string) => void;
}

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

const TopicStarter: React.FC<ParliamentHomeProps & { mode: ParliamentMode }> = ({
  notes,
  topics,
  isLoadingTopics,
  onStartDebate,
  onStartPodcast,
  mode
}) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleStart = (topic: string, noteId?: string) => {
    if (mode === 'debate') {
      onStartDebate(topic, noteId);
    } else {
      onStartPodcast(topic, noteId);
    }
  };

  const handleStartFromNote = () => {
    if (selectedNote) {
      const topic = `A discussion inspired by the note: "${selectedNote.title || 'Untitled'}"`;
      handleStart(topic, selectedNote.id);
    }
  };

  const modeTitle = mode === 'debate' ? 'Start a Debate' : 'Start a Podcast';

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in-50">
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
              <p className="text-sm text-slate-500 dark:text-slate-400">Create a note to start a session from it.</p>
            )}
          </div>
          <button 
            onClick={handleStartFromNote} 
            disabled={!selectedNote} 
            className="w-full mt-auto bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {modeTitle}
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
                  className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
  );
}

const ParliamentHome: React.FC<ParliamentHomeProps> = (props) => {
  const [setupMode, setSetupMode] = useState<ParliamentMode | null>(null);

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          {setupMode && (
             <button onClick={() => setSetupMode(null)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2">← Back to modes</button>
          )}
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Parliament</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {setupMode ? `Choose a starting point for your ${setupMode}.` : 'Explore your ideas from multiple perspectives through automated AI conversations.'}
          </p>
        </div>
        <div className="space-y-8">
            {!setupMode 
                ? <ModeSelection onSelect={setSetupMode} /> 
                : <TopicStarter {...props} mode={setupMode} />
            }
        </div>
      </div>
    </div>
  );
};

export default ParliamentHome;