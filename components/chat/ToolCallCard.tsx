
import React, { useState } from 'react';
import { ToolCall, AIAgent, ChatMessage } from '../../types';
import CpuChipIcon from '../icons/CpuChipIcon';
import MagnifyingGlassIcon from '../icons/MagnifyingGlassIcon';
import DocumentPlusIcon from '../icons/DocumentPlusIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { AgentAvatar } from './ChatUIComponents';
import BookOpenIcon from '../icons/BookOpenIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';


const toolIconMap: { [key: string]: React.FC<any> } = {
  search_notes: MagnifyingGlassIcon,
  create_note: DocumentPlusIcon,
  default: CpuChipIcon,
};

interface ToolResultContentProps {
    message: ChatMessage;
    onPreviewNote: (noteId: string) => void;
}

const ToolResultContent: React.FC<ToolResultContentProps> = ({ message, onPreviewNote }) => {
    const { structuredContent } = message;
    const [isCollapsed, setIsCollapsed] = useState(
        structuredContent?.type === 'search_result' && structuredContent.notes.length > 3
    );

    if (!structuredContent) {
        return <p className="text-sm text-slate-600 dark:text-slate-300">{message.content}</p>;
    }

    if (structuredContent.type === 'search_result') {
        return (
            <div>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full text-left text-sm text-slate-600 dark:text-slate-300 mb-2 flex items-center justify-between"
                    disabled={structuredContent.notes.length === 0}
                >
                    <span>Found {structuredContent.notes.length} note(s).</span>
                    {structuredContent.notes.length > 3 && (
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    )}
                </button>
                {!isCollapsed && (
                    <div className="space-y-1 pl-2 border-l-2 border-slate-300 dark:border-slate-600 animate-in fade-in">
                        {structuredContent.notes.map(note => (
                            <button key={note.id} onClick={() => onPreviewNote(note.id)} className="w-full text-left p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <div className="flex items-center gap-2">
                                    <BookOpenIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <span className="font-medium text-sm truncate">{note.title || 'Untitled Note'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    if (structuredContent.type === 'create_note_result') {
        return (
            <p className="text-sm text-slate-600 dark:text-slate-300">
                {structuredContent.message}{' '}
                <button onClick={() => onPreviewNote(structuredContent.noteId)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    View Note
                </button>
            </p>
        );
    }
    
    return null;
};


interface ToolCallCardProps {
  toolCalls: ToolCall[];
  text?: string | null;
  agent?: AIAgent;
  toolResults?: { [key: string]: ChatMessage };
  onPreviewNote: (noteId: string) => void;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCalls, text, agent, toolResults = {}, onPreviewNote }) => {
  return (
    <div className="flex items-start gap-3 max-w-4xl mx-auto">
      {agent ? (
        <AgentAvatar agent={agent} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          <CpuChipIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>
      )}
      <div className="flex-1">
        {text && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{text}</p>}
        <div className="space-y-2">
          {toolCalls.map((call) => {
            const Icon = toolIconMap[call.name] || toolIconMap.default;
            const resultMessage = call.id ? toolResults[call.id] : undefined;
            const isCompleted = !!resultMessage;
            
            return (
              <div key={call.id || call.name} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{call.name}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {isCompleted ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      </>
                    )}
                  </div>
                </div>
                <pre className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-md whitespace-pre-wrap break-all">
                  <code>{JSON.stringify(call.args, null, 2)}</code>
                </pre>
                {isCompleted && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600/50">
                        <ToolResultContent message={resultMessage} onPreviewNote={onPreviewNote} />
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ToolCallCard;