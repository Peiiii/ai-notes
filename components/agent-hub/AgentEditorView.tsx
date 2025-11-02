import React, { useState, useEffect, useRef } from 'react';
import { Presenter } from '../../presenter';
import { ChatMessage, AIAgent } from '../../types';
import SparklesIcon from '../icons/SparklesIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import PencilIcon from '../icons/PencilIcon';

interface AgentEditorViewProps {
  presenter: Presenter;
  agent: AIAgent;
  onEditSuccess: () => void;
  onCancel: () => void;
}

const AgentEditorView: React.FC<AgentEditorViewProps> = ({ presenter, agent, onEditSuccess, onCancel }) => {
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'model',
      persona: 'Agent Architect',
      content: `I'm ready to help you edit "${agent.name}". What would you like to change? You can update the name, description, system instructions, icon, or color.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };
    
    const currentHistory = [...history, userMessage];
    setHistory(currentHistory);
    setInput('');
    setIsThinking(true);
    
    try {
        const { modelMessage, toolResponseMessage, wasUpdated } = await presenter.handleAgentEditorChat(currentHistory, agent);
        let finalHistory = [...currentHistory, modelMessage];
        if (toolResponseMessage) {
            finalHistory.push(toolResponseMessage);
        }
        setHistory(finalHistory);

        if (wasUpdated) {
            setTimeout(() => onEditSuccess(), 1500);
        }
    } catch (error) {
        console.error("Agent editing chat failed", error);
        setHistory(h => [...h, {id: 'error', role: 'model', content: 'Sorry, an error occurred.'}]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
             <h2 className="text-xl font-bold flex items-center gap-2"><PencilIcon className="w-5 h-5"/> Edit with AI</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.map(msg => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role !== 'user' && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                    )}
                    <div className={`p-3 rounded-lg max-w-sm text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : msg.role === 'tool' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-bl-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                        {msg.persona && <p className="font-bold mb-1 text-sm">{msg.persona}</p>}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                     {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                    )}
                </div>
            ))}
             {isThinking && (
                 <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                    </div>
                 </div>
             )}
            <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={isThinking ? "Architect is thinking..." : "e.g., Change the name to..."}
                    className="flex-1 w-full bg-white dark:bg-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isThinking}
                />
                <button onClick={handleSend} disabled={isThinking || !input.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400"><PaperAirplaneIcon className="w-5 h-5"/></button>
                <button onClick={onCancel} className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Back</button>
            </div>
        </div>
    </div>
  );
};

export default AgentEditorView;