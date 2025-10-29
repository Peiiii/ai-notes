
import React, { useState } from 'react';
import { ChatMessage, Note } from '../../types';
import CpuChipIcon from '../icons/CpuChipIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface ToolResultCardProps {
  message: ChatMessage;
  onSelectNote: (noteId: string) => void;
}

const ToolResultCard: React.FC<ToolResultCardProps> = ({ message, onSelectNote }) => {
  const { structuredContent } = message;
  const toolName = message.toolCalls?.[0]?.name || 'Unknown Tool';
  
  const initialCollapseState = structuredContent?.type === 'search_result' && structuredContent.notes.length > 3;
  const [isCollapsed, setIsCollapsed] = useState(initialCollapseState);

  if (!structuredContent) return null;

  return (
    <div className="flex items-start gap-3 max-w-4xl mx-auto">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <CpuChipIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tool Result: {toolName}</span>
        </div>
        {structuredContent.type === 'search_result' && (
          <div>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full text-left text-sm text-slate-600 dark:text-slate-300 mb-2 flex items-center justify-between"
            >
              <span>Found {structuredContent.notes.length} note(s).</span>
              <ChevronRightIcon className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
            </button>
            {!isCollapsed && (
              <div className="space-y-1 pl-2 border-l-2 border-slate-300 dark:border-slate-600 animate-in fade-in">
                {structuredContent.notes.map(note => (
                  <button 
                    key={note.id} 
                    onClick={() => onSelectNote(note.id)}
                    className="w-full text-left p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{note.title || 'Untitled Note'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {structuredContent.type === 'create_note_result' && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {structuredContent.message}{' '}
            <button 
                onClick={() => onSelectNote(structuredContent.noteId)} 
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                View Note
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ToolResultCard;
