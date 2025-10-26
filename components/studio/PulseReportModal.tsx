
import React from 'react';
import { PulseReport } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import Modal from '../ui/Modal';

declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

interface PulseReportModalProps {
  report: PulseReport | null;
  onClose: () => void;
}

const PulseReportModal: React.FC<PulseReportModalProps> = ({ report, onClose }) => {
  return (
    <Modal isOpen={!!report} onClose={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{report?.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generated on {report && new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {report && (
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: window.marked.parse(report.content) }}
            >
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PulseReportModal;
