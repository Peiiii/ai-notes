

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useNotesStore } from '../stores/notesStore';
import { useWikiStore } from '../stores/wikiStore';
import { useChatStore } from '../stores/chatStore';
import { useAgentStore } from '../stores/agentStore';
import { AppManager } from '../managers/AppManager';
import { NotesManager } from '../managers/NotesManager';
import { ChatManager } from '../managers/ChatManager';
import { StudioManager } from '../managers/StudioManager';
import { WikiManager } from '../managers/WikiManager';
import { ParliamentManager } from '../managers/ParliamentManager';
import { CommandManager } from '../managers/CommandManager';
import { InsightManager } from '../managers/InsightManager';
import { KnowledgeCard, Note, WikiEntry, WIKI_ROOT_ID, DebateSynthesis, Todo, AIAgent, ChatMessage, DiscussionMode, ProactiveSuggestion } from '../types';
import { Command } from '../commands';
import { generateProactiveSuggestions } from '../services/insightAIService';
import { getCreatorAgentResponse } from '../services/agentAIService';

// simple debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number | undefined;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), waitFor);
  };
};

export class Presenter {
  appManager = new AppManager();
  notesManager = new NotesManager();
  chatManager: ChatManager;
  studioManager = new StudioManager();
  wikiManager = new WikiManager();
  parliamentManager = new ParliamentManager();
  commandManager = new CommandManager();
  insightManager = new InsightManager();

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
    const { sessions, activeSessionId } = useChatStore.getState();
    if (sessions.length === 0) {
      // First-time user, create a default session with the main companion AND a group chat
      const { agents } = useAgentStore.getState();
      const defaultCompanion = agents.find(a => a.id === 'default-companion');
      const allDefaultAgents = agents.filter(a => !a.isCustom);
      
      if (defaultCompanion) {
        // This method will create the session and automatically set it as active
        const companionSessionId = this.chatManager.createSession([defaultCompanion.id], 'concurrent');
        
        // Create the group chat but don't set it to active
        if (allDefaultAgents.length > 1) {
            this.chatManager.createSession(allDefaultAgents.map(a => a.id), 'moderated');
        }
        
        // Set the one-on-one as the active one to start
        this.handleSetActiveChatSession(companionSessionId);
      }
    } else if (!activeSessionId) {
      // User has sessions but none is active (e.g., after app load).
      // The sessions are already sorted newest-first in the store.
      this.handleSetActiveChatSession(sessions[0].id);
    }
    
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
  
  // --- New Multi-Agent Chat Methods ---
  
  handleCreateAgent = (agentData: Omit<AIAgent, 'id' | 'createdAt' | 'isCustom'>): AIAgent => {
    const newAgent: AIAgent = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        isCustom: true,
        ...agentData
    };
    useAgentStore.setState(state => ({ agents: [...state.agents, newAgent] }));
    return newAgent;
  }

  handleUpdateAgent = (agentData: AIAgent) => {
      if (!agentData.isCustom) {
          alert("The default companion cannot be edited.");
          return;
      }
      useAgentStore.setState(state => ({
          agents: state.agents.map(a => a.id === agentData.id ? agentData : a)
      }));
  }

  handleDeleteAgent = (agentId: string) => {
      const agentToDelete = useAgentStore.getState().agents.find(a => a.id === agentId);
      if (!agentToDelete?.isCustom) {
          alert("The default companion cannot be deleted.");
          return;
      }
      useAgentStore.setState(state => ({
          agents: state.agents.filter(a => a.id !== agentId)
      }));
      // Also remove this agent from any chat sessions
      useChatStore.setState(state => ({
          sessions: state.sessions.map(session => ({
              ...session,
              participantIds: session.participantIds.filter(id => id !== agentId)
          })).filter(session => session.participantIds.length > 0) // Remove sessions that are now empty
      }));
  }

  handleCreateChatSession = (participantIds: string[], discussionMode: DiscussionMode) => {
      this.chatManager.createSession(participantIds, discussionMode);
  }
  
  handleSetActiveChatSession = (sessionId: string | null) => {
      useChatStore.setState({ activeSessionId: sessionId });
  }

  handleDeleteChatSession = (sessionId: string) => {
      useChatStore.setState(state => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          let newActiveSessionId = state.activeSessionId;
          if (state.activeSessionId === sessionId) {
              newActiveSessionId = newSessions.length > 0 ? newSessions[0].id : null;
          }
          return { sessions: newSessions, activeSessionId: newActiveSessionId };
      });
  }

  handleClearSessionHistory = (sessionId: string) => {
    this.chatManager.clearSessionHistory(sessionId);
  }

  handleSendMessage = (sessionId: string, message: string) => {
      this.chatManager.sendMessageInSession(sessionId, message);
  }
  
  handleAddAgentsToSession = (sessionId: string, agentIds: string[]) => {
      this.chatManager.addAgentsToSession(sessionId, agentIds);
  }
  
  handleUpdateSessionMode = (sessionId: string, newMode: DiscussionMode) => {
      this.chatManager.updateSessionMode(sessionId, newMode);
  }
  
  handleGenerateChatSuggestions = async (notes: Note[]): Promise<ProactiveSuggestion[]> => {
    try {
      const suggestions = await generateProactiveSuggestions(notes);
      return suggestions;
    } catch (error) {
      console.error("Failed to generate proactive chat suggestions:", error);
      return [];
    }
  }

  handleAgentCreatorChat = async (history: ChatMessage[]) => {
      const response = await getCreatorAgentResponse(history);
      
      let finalAgent: AIAgent | null = null;
      let toolResponseMessage: ChatMessage | null = null;
      
      if (response.toolCalls && response.toolCalls[0]?.name === 'create_new_agent') {
        const call = response.toolCalls[0];
        const { name, description, systemInstruction, icon, color } = call.args;
        
        if(name && description && systemInstruction) {
             finalAgent = this.handleCreateAgent({
                name: name as string,
                description: description as string,
                systemInstruction: systemInstruction as string,
                icon: icon as string || 'SparklesIcon',
                color: color as string || 'indigo',
            });
            toolResponseMessage = {
                id: crypto.randomUUID(),
                role: 'tool',
                content: `Successfully created agent: ${name}`,
                tool_call_id: call.id
            }
        } else {
             toolResponseMessage = {
                id: crypto.randomUUID(),
                role: 'tool',
                content: `I couldn't create the agent. I am missing some required information. Please ensure you provide a name, description, and system instructions.`,
                tool_call_id: call.id
            }
        }
      }

      const modelMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'model',
          content: response.text || '',
          toolCalls: response.toolCalls || undefined,
          persona: "Agent Architect",
      }
      
      return { modelMessage, toolResponseMessage, createdAgent: finalAgent };
  }


  // --- Live Insights ---
  debouncedGetInsights = debounce(this.insightManager.getInsightsForNote, 1500);

  handleNoteContentChange = (content: string, noteId: string) => {
    this.debouncedGetInsights(content, noteId);
  };

  handleAdoptInsightTodo = (task: string) => {
      const newTodo: Todo = {
          id: crypto.randomUUID(),
          text: task,
          completed: false
      };
      this.studioManager.adoptTodo(newTodo, true);
  }
  
  handleCreateInsightWiki = (term: string, sourceNoteId: string, contextContent: string) => {
      this.wikiManager.generateWiki(term, sourceNoteId, null, contextContent).then(newWiki => {
          this.handleViewWikiInStudio(newWiki.id);
      });
  }
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
