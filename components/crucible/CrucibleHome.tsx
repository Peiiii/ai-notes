import React, { useState } from 'react';
import { usePresenter } from '../../presenter';
import { useCrucibleStore } from '../../stores/crucibleStore';
import BeakerIcon from '../icons/BeakerIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import TrashIcon from '../icons/TrashIcon';

const CrucibleHome: React.FC = () => {
  const presenter = usePresenter();
  const { sessions } = useCrucibleStore();
  const [topicInput, setTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await presenter.crucibleManager.startNewSession(topicInput.trim());
      setTopicInput('');
    } catch (error) {
      alert('Failed to start a new session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <BeakerIcon className="w-16 h-16 text-indigo-400 mb-4 mx-auto" />
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Story Engine</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">From a single concept to a complete story architecture.</p>
        </div>

        {/* New Session Input */}
        <form onSubmit={handleStartSession} className="w-full max-w-xl mx-auto mb-12 flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Start with a new topic..."
            className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-full pl-5 pr-2 py-3 text-base focus:outline-none disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!topicInput.trim() || isLoading}
            className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-14 h-14 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </form>

        {/* Session History */}
        {sessions.length > 0 && (
          <section className="animate-in fade-in-50">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Session History</h2>
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="group w-full flex items-center gap-2 text-left p-3 pr-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500">
                  <button onClick={() => presenter.crucibleManager.viewSession(session.id)} className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{session.topic}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Created on {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); presenter.crucibleManager.deleteSession(session.id); }} 
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
      </div>
    </div>
  );
};

export default CrucibleHome;
