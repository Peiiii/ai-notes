
import React, { useMemo, useRef, useEffect } from 'react';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { AgentAvatar } from './ChatUIComponents';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import GlobeAltIcon from '../icons/GlobeAltIcon';
import ToolCallCard from './ToolCallCard';
import { ChatMessage } from '../../types';
import ClickPopover from '../ui/ClickPopover';
import AgentProfileCard from './AgentProfileCard';

const ThinkingIndicator = () => (
    <div className="flex items-center gap-1.5 p-3">
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
    </div>
);

const ChatHistory: React.FC = () => {
    const presenter = usePresenter();
    const { activeSessionId, sessions } = useChatStore();
    const agents = useAgentStore(state => state.agents);
    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const previousSessionId = useRef<string | null>(null);

    useEffect(() => {
        const isNewSession = previousSessionId.current !== activeSession?.id;
        chatEndRef.current?.scrollIntoView({ behavior: isNewSession ? 'instant' : 'smooth' });
        previousSessionId.current = activeSession?.id ?? null;
    }, [activeSession?.id, activeSession?.history]);

    const processedHistory = useMemo(() => {
        const history = activeSession?.history || [];
        if (!history.length) return [];

        const messagesToRender: (ChatMessage & { attachedToolResults?: { [key: string]: ChatMessage } })[] = [];
        const consumedToolMessageIds = new Set<string>();

        for (let i = 0; i < history.length; i++) {
            const msg = history[i];

            if (consumedToolMessageIds.has(msg.id)) {
                continue;
            }

            if (msg.role === 'model' && msg.toolCalls && msg.toolCalls.length > 0) {
                const toolResults: { [key: string]: ChatMessage } = {};
                const toolCallIds = new Set(msg.toolCalls.map(tc => tc.id).filter(Boolean));

                for (let j = i + 1; j < history.length; j++) {
                    const potentialResultMsg = history[j];
                    if (potentialResultMsg.role !== 'tool') continue;

                    const resultToolCallId = potentialResultMsg.tool_call_id || potentialResultMsg.toolCalls?.[0]?.id;
                    if (resultToolCallId && toolCallIds.has(resultToolCallId)) {
                        toolResults[resultToolCallId] = potentialResultMsg;
                        consumedToolMessageIds.add(potentialResultMsg.id);
                    }
                }
                messagesToRender.push({ ...msg, attachedToolResults: toolResults });
            } else {
                messagesToRender.push(msg);
            }
        }
        return messagesToRender;
    }, [activeSession?.history]);


    if (!activeSession) return null;

    const participants = agents.filter(a => activeSession.participantIds.includes(a.id));

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {processedHistory.map((msg) => {
                const agent = agents.find(a => a.name === msg.persona);
                if (msg.role === 'system') return (
                    <div key={msg.id} className="text-center text-xs text-slate-400 dark:text-slate-500 italic my-2">
                        {msg.content}
                    </div>
                );
                if (msg.role === 'user') return (
                    <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto justify-end">
                    <div className="p-3 rounded-lg max-w-lg bg-indigo-600 text-white rounded-br-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    </div>
                );
                if (msg.role === 'model' && msg.toolCalls) {
                    return <ToolCallCard 
                        key={msg.id} 
                        toolCalls={msg.toolCalls} 
                        text={msg.content} 
                        agent={agent} 
                        toolResults={msg.attachedToolResults}
                        onPreviewNote={presenter.handlePreviewNote}
                    />;
                }
                
                // Standalone tool results should not be rendered as they are now part of ToolCallCard
                if (msg.role === 'tool') return null;

                return (
                    <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto">
                    {agent ? (
                        <ClickPopover content={<AgentProfileCard agent={agent} />}>
                            {({ onClick, ref }) => (
                                <button ref={ref} onClick={onClick} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800">
                                    <AgentAvatar agent={agent} />
                                </button>
                            )}
                        </ClickPopover>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                    )}
                    <div className="flex flex-col items-start">
                        <div className="p-3 rounded-lg max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                        {msg.persona && participants.length > 1 && <p className="text-xs font-bold mb-1 text-indigo-600 dark:text-indigo-400">{msg.persona}</p>}
                        
                        {msg.status === 'thinking' ? (
                            <ThinkingIndicator />
                        ) : (
                            <div className="text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: window.marked.parse(msg.content) }}></div>
                        )}

                        </div>
                        {msg.sourceNotes && msg.sourceNotes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                            <BookOpenIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources:</span>
                            {msg.sourceNotes.map(note => (
                                <button key={note.id} onClick={() => presenter.handleSelectNote(note.id)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                                    {note.title}
                                </button>
                            ))}
                        </div>
                        )}
                        {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 w-full max-w-lg">
                            <div className="flex items-center gap-2 mb-2">
                            <GlobeAltIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources from the web</h4>
                            </div>
                            <ul className="space-y-1.5">
                            {msg.groundingChunks.map((chunk, index) => {
                                if (!chunk.web) return null;
                                try {
                                const hostname = new URL(chunk.web.uri).hostname;
                                return (
                                    <li key={index}>
                                    <a 
                                        href={chunk.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-w-0 group"
                                    >
                                        <p className="truncate font-semibold group-hover:text-blue-500 dark:group-hover:text-blue-300">{chunk.web.title}</p>
                                        <p className="truncate text-slate-500 dark:text-slate-400">{hostname}</p>
                                    </a>
                                    </li>
                                )
                                } catch(e) {
                                return null;
                                }
                            })}
                            </ul>
                        </div>
                        )}
                    </div>
                    </div>
                );
            })}
            <div ref={chatEndRef} />
        </div>
    );
};

export default ChatHistory;
