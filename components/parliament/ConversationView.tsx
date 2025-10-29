import React, { useEffect, useRef } from 'react';
import { ChatMessage, DebateSynthesis, ParliamentMode } from '../../types';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import DocumentPlusIcon from '../icons/DocumentPlusIcon';

interface ConversationViewProps {
  sessionHistory: ChatMessage[];
  isSessionActive: boolean;
  currentSession: {
    mode: ParliamentMode;
    topic: string;
    noteId?: string;
  } | null;
  onResetSession: () => void;
  onSaveSynthesis: (topic: string, synthesis: DebateSynthesis) => void;
}

const personaDetails: Record<string, { color: string; bgColor: string }> = {
  'The Pragmatist': {
    color: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-50 dark:bg-sky-900/50',
  },
  'The Visionary': {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/50',
  },
  'Moderator': {
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
  'Host': {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/50',
  },
  'Guest Expert': {
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-50 dark:bg-teal-900/50',
  },
};

const SynthesisCard: React.FC<{ synthesis: DebateSynthesis; topic: string; onSave: () => void }> = ({ synthesis, topic, onSave }) => {
  return (
    <div className="my-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Moderator's Synthesis</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">A summary of the debate on "{topic}"</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">Core Tension</h4>
          <p className="text-sm text-slate-800 dark:text-slate-200">{synthesis.coreTension}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className={`font-semibold text-sm mb-2 ${personaDetails['The Pragmatist'].color}`}>The Pragmatist's Points</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {synthesis.keyPointsPragmatist.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold text-sm mb-2 ${personaDetails['The Visionary'].color}`}>The Visionary's Points</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {synthesis.keyPointsVisionary.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">Next Steps</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {synthesis.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-lg text-right">
        <button onClick={onSave} className="inline-flex items-center text-sm font-semibold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 px-3 py-2 rounded-md shadow-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <DocumentPlusIcon className="w-4 h-4 mr-2" />
          Save as Note
        </button>
      </div>
    </div>
  )
};

const ConversationView: React.FC<ConversationViewProps> = ({
  sessionHistory,
  isSessionActive,
  currentSession,
  onResetSession,
  onSaveSynthesis,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionHistory, isSessionActive]);

  const modeTitle = currentSession?.mode === 'debate' ? 'Debate' : 'Podcast';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <button onClick={onResetSession} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeftIcon className="w-5 h-5"/>
        </button>
        <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Parliament / {modeTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">Topic: {currentSession?.topic}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
            {sessionHistory.map((msg) => {
                if (msg.synthesisContent && currentSession) {
                    return <SynthesisCard 
                              key={msg.id} 
                              synthesis={msg.synthesisContent} 
                              topic={currentSession.topic} 
                              onSave={() => onSaveSynthesis(currentSession.topic, msg.synthesisContent!)}
                           />;
                }

                const details = personaDetails[msg.persona || 'Moderator'];
                const isRightAligned = msg.persona === 'The Visionary' || msg.persona === 'Guest Expert';

                return (
                    <div key={msg.id} className={`flex items-start gap-3 ${isRightAligned ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-3 rounded-lg max-w-lg ${details.bgColor} ${isRightAligned ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                            <p className={`font-bold text-sm mb-1 ${details.color}`}>{msg.persona}</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">{msg.content}</p>
                        </div>
                    </div>
                );
            })}
            {isSessionActive && (
                <div className="flex items-start gap-3 max-w-4xl justify-start">
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <div ref={chatEndRef} />
      </div>
      {!isSessionActive && sessionHistory.length > 0 && (
         <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto flex gap-2">
                <button onClick={onResetSession} className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Start a New Session
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default ConversationView;