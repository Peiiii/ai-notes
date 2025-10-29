
import React from 'react';
import { ToolCall } from '../../types';
import CpuChipIcon from '../icons/CpuChipIcon';
import MagnifyingGlassIcon from '../icons/MagnifyingGlassIcon';
import DocumentPlusIcon from '../icons/DocumentPlusIcon';

const toolIconMap: { [key: string]: React.FC<any> } = {
  search_notes: MagnifyingGlassIcon,
  create_note: DocumentPlusIcon,
  default: CpuChipIcon,
};

interface ToolCallCardProps {
  toolCalls: ToolCall[];
  text?: string | null;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCalls, text }) => {
  return (
    <div className="flex items-start gap-3 max-w-4xl mx-auto">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <CpuChipIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1">
        {text && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{text}</p>}
        <div className="space-y-2">
          {toolCalls.map((call) => {
            const Icon = toolIconMap[call.name] || toolIconMap.default;
            return (
              <div key={call.id || call.name} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{call.name}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
                <pre className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-md whitespace-pre-wrap break-all">
                  <code>{JSON.stringify(call.args, null, 2)}</code>
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ToolCallCard;
