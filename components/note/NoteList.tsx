import React from 'react';
import { usePresenter } from '../../presenter';
import { useNotesStore } from '../../stores/notesStore';
import { useAppStore } from '../../stores/appStore';
import { useStudioStore } from '../../stores/studioStore';
import { ViewMode } from '../../types';
import DocumentPlusIcon from '../icons/DocumentPlusIcon';
import TrashIcon from '../icons/TrashIcon';
import Squares2X2Icon from '../icons/Squares2X2Icon';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import UsersIcon from '../icons/UsersIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import HoverPopup from '../ui/HoverPopup';
import ChevronDoubleLeftIcon from '../icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from '../icons/ChevronDoubleRightIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import BeakerIcon from '../icons/BeakerIcon';

const NoteList: React.FC = () => {
  const presenter = usePresenter();
  const { notes, generatingTitleIds } = useNotesStore();
  const { activeNoteId, viewMode, isMainSidebarCollapsed } = useAppStore();
  const { isLoadingAI } = useStudioStore();

  const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  const NavButton: React.FC<{
    view: ViewMode;
    title: string;
    icon: React.ReactNode;
    loading?: boolean;
  }> = ({ view, title, icon, loading }) => {
    const handlers: Record<ViewMode, () => void> = {
      'studio': presenter.handleShowStudio,
      'chat': presenter.handleShowChat,
      'wiki': presenter.handleShowWiki,
      'parliament': presenter.handleShowParliament,
      'crucible': presenter.handleShowCrucible,
      'editor': presenter.handleReturnToEditor
    };
    const isActive = viewMode === view;

    const buttonContent = (
      <button
        onClick={handlers[view]}
        className={`flex items-center text-sm font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500 ${
          isActive
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
            : 'bg-slate-200/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        } ${isMainSidebarCollapsed ? 'w-12 h-12 justify-center' : 'w-full px-4 py-2 gap-2'}`}
      >
        {icon}
        <span className={`whitespace-nowrap transition-all duration-200 ${isMainSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          {title}
        </span>
        {loading && !isMainSidebarCollapsed && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-auto"></div>}
      </button>
    );

    return isMainSidebarCollapsed ? (
      <HoverPopup
        trigger={buttonContent}
        content={<div className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">{title}</div>}
        popupClassName="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30"
      />
    ) : buttonContent;
  };

  return (
    <div className="h-full bg-slate-100 dark:bg-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className={`flex items-center ${isMainSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <CpuChipIcon className="w-8 h-8 text-indigo-500 flex-shrink-0" />
           <div className={`grid transition-all duration-300 ease-in-out ${isMainSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">ThoughtStream</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Capture & Connect Ideas</p>
              </div>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <button
          onClick={presenter.handleNewTextNote}
          title="New Note"
          className={`flex w-full items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all duration-300 ${isMainSidebarCollapsed ? 'h-12 justify-center' : 'gap-2'}`}
        >
          <DocumentPlusIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`whitespace-nowrap transition-all duration-200 ${isMainSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>New Note</span>
        </button>
        <div className={`grid gap-2 ${isMainSidebarCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <NavButton view="studio" title="Studio" icon={<Squares2X2Icon className="w-5 h-5 flex-shrink-0" />} loading={isLoadingAI && viewMode === 'studio'} />
          <NavButton view="chat" title="Chat" icon={<ChatBubbleLeftRightIcon className="w-5 h-5 flex-shrink-0" />} />
          <NavButton view="wiki" title="Wiki" icon={<BookOpenIcon className="w-5 h-5 flex-shrink-0" />} />
          <NavButton view="parliament" title="Parliament" icon={<UsersIcon className="w-5 h-5 flex-shrink-0" />} />
        </div>
         <div className="mt-2">
            <NavButton view="crucible" title="Crucible" icon={<BeakerIcon className="w-5 h-5 flex-shrink-0" />} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2">
          {sortedNotes.map((note) => {
            const hasTitle = !!note.title;
            const isGeneratingTitle = !hasTitle && generatingTitleIds.has(note.id);
            const displayTitle = hasTitle ? note.title : (note.content || 'New Note');
            
            const noteItemButton = (
              <button
                onClick={() => presenter.handleSelectNote(note.id)}
                className={`w-full text-left rounded-lg transition-all duration-300 group flex items-center relative overflow-hidden ${
                  note.id === activeNoteId && viewMode === 'editor'
                    ? 'bg-indigo-100 dark:bg-indigo-900/50'
                    : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                } ${isMainSidebarCollapsed ? 'w-12 h-12 justify-center' : 'p-3'}`}
              >
                 {/* Collapsed Icon */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isMainSidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}>
                  <DocumentTextIcon className={`w-5 h-5 flex-shrink-0 ${note.id === activeNoteId && viewMode === 'editor' ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                
                {/* Expanded Content */}
                <div className={`w-full flex items-center gap-3 transition-opacity duration-300 ${isMainSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="flex-1 overflow-hidden">
                    <h3 className={`font-semibold truncate ${note.id === activeNoteId && viewMode === 'editor' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>{displayTitle}</h3>
                    <p className={`text-xs truncate ${note.id === activeNoteId && viewMode === 'editor' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{hasTitle ? (note.content || 'No content') : new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isGeneratingTitle ? (
                    <div className="ml-2 p-1"><div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : (
                    <div onClick={(e) => {e.stopPropagation(); presenter.handleDeleteNote(note.id);}} className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${note.id === activeNoteId && viewMode === 'editor' ? 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50' : 'text-slate-500 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400'}`}><TrashIcon className="w-4 h-4" /></div>
                  )}
                </div>
              </button>
            );

            return (
              <li key={note.id}>
                {isMainSidebarCollapsed ? (
                  <HoverPopup
                    trigger={noteItemButton}
                    content={<div className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">{displayTitle}</div>}
                    popupClassName="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30"
                  />
                ) : noteItemButton}
              </li>
            );
          })}
        </ul>
      </div>
      <div className={`p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center transition-all duration-300 ${isMainSidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => presenter.appManager.setMainSidebarCollapsed(!isMainSidebarCollapsed)}
          title={isMainSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50 w-10 h-10 justify-center"
        >
          {isMainSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default NoteList;