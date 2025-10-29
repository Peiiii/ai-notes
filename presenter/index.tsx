import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useNotesStore } from '../stores/notesStore';
import { useWikiStore } from '../stores/wikiStore';
import { AppManager } from '../managers/AppManager';
import { NotesManager } from '../managers/NotesManager';
import { ChatManager } from '../managers/ChatManager';
import { StudioManager } from '../managers/StudioManager';
import { WikiManager } from '../managers/WikiManager';
import { ParliamentManager } from '../managers/ParliamentManager';
import { CommandManager } from '../managers/CommandManager';
import { KnowledgeCard, Note, WikiEntry, WIKI_ROOT_ID, DebateSynthesis } from '../types';
import { Command } from '../commands';

export class Presenter {
  appManager = new AppManager();
  notesManager = new NotesManager();
  chatManager: ChatManager;
  studioManager = new StudioManager();
  wikiManager = new WikiManager();
  parliamentManager = new ParliamentManager();
  commandManager = new CommandManager();

  constructor() {
    this.chatManager = new ChatManager(this.notesManager);
  }

  // --- Orchestration Methods ---

  handleNewTextNote = () => {
    const newNote = this.notesManager.createNewTextNote();
    this.appManager.setActiveNoteId(newNote.id);
    this.appManager.setViewMode('editor');
  };
  
  handleDeleteNote = (id: string) => {
    const { activeNoteId } = useAppStore.getState();
    this.notesManager.deleteNoteById(id);
    this.wikiManager.deleteWikisBySourceNoteId(id);
    if (activeNoteId === id) {
      this.appManager.setActiveNoteId(null);
    }
  };

  handleSelectNote = (id: string) => {
    this.appManager.setActiveNoteId(id);
    this.appManager.setViewMode('editor');
  };

  handleShowChat = () => {
    this.appManager.setViewMode('chat');
    this.appManager.setActiveNoteId(null);
  };

  handleShowStudio = () => {
    this.appManager.setViewMode('studio');
    this.appManager.setActiveNoteId(null);
    this.studioManager.generateNewSummary();
    this.studioManager.generateNewMindMap();
  };

  handleShowWiki = () => {
    this.appManager.setInitialWikiHistory(null);
    this.appManager.setViewMode('wiki');
    this.appManager.setActiveNoteId(null);
    this.wikiManager.fetchWikiTopics();
  };

  handleShowParliament = () => {
    this.appManager.setViewMode('parliament');
    this.appManager.setActiveNoteId(null);
    this.parliamentManager.fetchTopics();
  };

  handleCardToNote = (card: KnowledgeCard) => {
    const newNote = this.notesManager.createNewTextNote();
    this.notesManager.updateNote(newNote.id, { title: card.title, content: card.content });
    this.appManager.setActiveNoteId(newNote.id);
    this.appManager.setViewMode('editor');
  };

  handleSendThreadMessage = (noteId: string, message: string) => {
    this.chatManager.sendThreadChatMessage(noteId, message);
  };

  handleOpenCreateCommandModal = (commandName: string) => {
    this.appManager.setCommandToCreate(commandName);
  };

  handleCreateCommand = (commandData: Omit<Command, 'isCustom'>) => {
    this.commandManager.createCommand(commandData);
  };

  handleViewWikiInStudio = (wikiId: string) => {
    const { wikis } = useWikiStore.getState();
    const targetWiki = wikis.find(w => w.id === wikiId);
    if (!targetWiki) return;

    const historyPath: WikiEntry[] = [targetWiki];
    let current = targetWiki;
    while (current.parentId) {
      const parent = wikis.find(w => w.id === current.parentId);
      if (parent && parent.id !== WIKI_ROOT_ID) {
        historyPath.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    this.appManager.setInitialWikiHistory(historyPath);
    this.appManager.setViewMode('wiki');
    this.appManager.setActiveNoteId(null);
  };

  handleSaveDebateSynthesisAsNote = (topic: string, synthesis: DebateSynthesis) => {
    const title = `Synthesis on: ${topic}`;
    const content = `
## Core Tension
${synthesis.coreTension}

## Key Arguments: The Pragmatist
${synthesis.keyPointsPragmatist.map(p => `- ${p}`).join('\n')}

## Key Arguments: The Visionary
${synthesis.keyPointsVisionary.map(p => `- ${p}`).join('\n')}

## Proposed Next Steps
${synthesis.nextSteps.map(p => `- ${p}`).join('\n')}
    `.trim();

    const newNote = this.notesManager.createNewTextNote();
    this.notesManager.updateNote(newNote.id, { title, content });
    this.appManager.setActiveNoteId(newNote.id);
    this.appManager.setViewMode('editor');
  };
}

const PresenterContext = createContext<Presenter | null>(null);

export const PresenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const presenterRef = useRef<Presenter | null>(null);
  if (presenterRef.current === null) {
    presenterRef.current = new Presenter();
  }

  useEffect(() => {
    presenterRef.current?.studioManager.init();
  }, [])

  return (
    <PresenterContext.Provider value={presenterRef.current}>
      {children}
    </PresenterContext.Provider>
  );
};

export const usePresenter = () => {
  const context = useContext(PresenterContext);
  if (!context) {
    throw new Error('usePresenter must be used within a PresenterProvider');
  }
  return context;
};
