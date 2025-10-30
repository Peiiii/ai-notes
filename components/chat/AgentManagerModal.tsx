
import React, { useState, useEffect, useRef } from 'react';
import { AIAgent, ChatMessage } from '../../types';
import { Presenter } from '../../presenter';
import Modal from '../ui/Modal';
import PlusIcon from '../icons/PlusIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import { AgentAvatar, agentIcons, iconColors } from './ChatUIComponents';

// --- Agent Manager Modal ---
interface AgentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AIAgent[];
  presenter: Presenter;
  onUpdateAgent: (agentData: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

const AgentManagerModal: React.FC<AgentManagerModalProps> = ({ isOpen, onClose, agents, presenter, onUpdateAgent, onDeleteAgent }) => {
    const [view, setView] = useState<'list' | 'creator' | 'editor'>('list');
    const [editingAgent, setEditingAgent] = useState<AIAgent | Omit<AIAgent, 'id' | 'createdAt' | 'isCustom'> | null>(null);

    const handleStartNew = () => {
        setView('creator');
    };
    const handleStartEdit = (agent: AIAgent) => {
        if (agent.isCustom) {
          setEditingAgent(agent);
          setView('editor');
        } else {
          alert("The default AI Companion cannot be edited.");
        }
    };

    const handleClose = () => {
        setView('list');
        setEditingAgent(null);
        onClose();
    };
    
    const handleBackToList = () => {
        setView('list');
        setEditingAgent(null);
    }
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
                {view === 'list' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manage Agents</h2>
                            <button onClick={handleStartNew} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"><PlusIcon className="w-4 h-4"/>New Agent</button>
                        </div>
                        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {agents.map(agent => (
                                <li key={agent.id} className="p-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <AgentAvatar agent={agent}/>
                                    <div className="flex-1">
                                        <p className="font-semibold">{agent.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                                    </div>
                                    <button onClick={() => handleStartEdit(agent)} disabled={!agent.isCustom} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => onDeleteAgent(agent.id)} disabled={!agent.isCustom} className="p-2 text-slate-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4"/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {view === 'creator' && <AgentCreatorView presenter={presenter} onFinish={handleBackToList} />}
                {view === 'editor' && <AgentEditorForm agent={editingAgent as AIAgent} onSave={onUpdateAgent} onFinish={handleBackToList} />}
            </div>
        </Modal>
    )
};

// --- Agent Creator (Conversational) ---
const AgentCreatorView: React.FC<{ presenter: Presenter; onFinish: () => void; }> = ({ presenter, onFinish }) => {
    const [history, setHistory] = useState<ChatMessage[]>([{
        id: '0', role: 'model', persona: 'Agent Architect',
        content: "Hello! I'm the Agent Architect. I can help you create a new AI agent. To start, what should we name it?"
    }]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsThinking(true);

        try {
            const { modelMessage, toolResponseMessage } = await presenter.handleAgentCreatorChat(newHistory);
            
            let finalHistory = [...newHistory, modelMessage];
            if (toolResponseMessage) {
                finalHistory.push(toolResponseMessage);
            }
            setHistory(finalHistory);

        } catch (error) {
            console.error("Agent creator chat failed:", error);
            setHistory(h => [...h, {id: crypto.randomUUID(), role: 'model', content: "Sorry, an error occurred."}]);
        } finally {
            setIsThinking(false);
        }
    }

    const isDone = history.some(m => m.role === 'tool');

    return (
        <div className="flex flex-col h-[70vh] max-h-[700px]">
            <h2 className="text-xl font-bold p-6 pb-2">Create Agent with AI</h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 max-w-md ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                       <div className={`p-2.5 rounded-lg text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>{msg.content}</div>
                    </div>
                ))}
                 {isThinking && (
                     <div className="flex items-start gap-3 max-w-md mr-auto">
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={endOfMessagesRef}></div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                {isDone ? (
                     <button onClick={onFinish} className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Finish</button>
                ) : (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={isThinking} placeholder="Your response..." className="flex-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button type="submit" disabled={isThinking || !input.trim()} className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600"><PaperAirplaneIcon className="w-5 h-5" /></button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Agent Editor Form (for editing existing agents) ---
const AgentEditorForm: React.FC<{ agent: AIAgent, onSave: (agent: AIAgent) => void, onFinish: () => void }> = ({ agent, onSave, onFinish }) => {
    const [editingAgent, setEditingAgent] = useState(agent);

    const handleSave = () => {
        onSave(editingAgent);
        onFinish();
    }
    
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Edit Agent</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input type="text" value={editingAgent.name} onChange={e => setEditingAgent({...editingAgent, name: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <input type="text" value={editingAgent.description} onChange={e => setEditingAgent({...editingAgent, description: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">System Instructions</label>
                    <textarea value={editingAgent.systemInstruction} onChange={e => setEditingAgent({...editingAgent, systemInstruction: e.target.value})} rows={5} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Icon</label>
                        <div className="flex flex-wrap gap-2">{Object.keys(agentIcons).map(iconName => (
                            <button key={iconName} onClick={() => setEditingAgent({...editingAgent, icon: iconName})} className={`p-1 rounded-full ${editingAgent.icon === iconName ? 'ring-2 ring-indigo-500' : ''}`}><AgentAvatar agent={{...editingAgent, icon: iconName} as AIAgent} /></button>
                        ))}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <div className="flex flex-wrap gap-2">{Object.keys(iconColors).map(colorName => (
                            <button key={colorName} onClick={() => setEditingAgent({...editingAgent, color: colorName})} className={`w-8 h-8 rounded-full ${iconColors[colorName].bg} ${editingAgent.color === colorName ? 'ring-2 ring-indigo-500' : ''}`}/>
                        ))}</div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button onClick={onFinish} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Save</button>
            </div>
        </div>
    )
};

export default AgentManagerModal;
