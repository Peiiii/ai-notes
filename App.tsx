
import React from 'react';
import { PresenterProvider, usePresenter } from './presenter';
import { useAppStore } from './stores/appStore';
import NoteList from './components/note/NoteList';
import NoteEditor from './components/note/NoteEditor';
import Studio from './components/studio/Studio';
import ChatView from './components/chat/ChatView';
import PulseReportModal from './components/studio/PulseReportModal';
import WikiStudio from './components/wiki/WikiStudio';
import ParliamentView from './components/parliament/ParliamentView';
import ErrorBoundary from './components/ui/ErrorBoundary';
import CreateCommandModal from './components/chat/CreateCommandModal';


function AppContent() {
  const presenter = usePresenter();
  const { viewMode, activeNoteId, viewingPulseReport, commandToCreate } = useAppStore();

  const renderMainView = () => {
    switch (viewMode) {
      case 'studio':
        return <Studio />;
      case 'chat':
        return <ChatView />;
      case 'wiki':
        return <WikiStudio />;
      case 'parliament':
        return <ParliamentView />;
      case 'editor':
      default:
        return <NoteEditor key={activeNoteId} />;
    }
  };

  return (
    <div className="h-screen w-screen flex antialiased text-slate-800 dark:text-slate-200 overflow-x-hidden">
      <div className="w-full max-w-xs md:w-1/3 md:max-w-sm lg:w-1/4 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
        <NoteList />
      </div>
      <main className="flex-1 min-w-0">{renderMainView()}</main>
      <PulseReportModal 
        report={viewingPulseReport} 
        onClose={() => presenter.appManager.setViewingPulseReport(null)} 
      />
      <CreateCommandModal
        isOpen={!!commandToCreate}
        onClose={() => presenter.appManager.setCommandToCreate(null)}
        onCreateCommand={presenter.handleCreateCommand}
        initialCommandName={commandToCreate || ''}
      />
    </div>
  );
}


function App() {
  return (
    <PresenterProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </PresenterProvider>
  );
}

export default App;
