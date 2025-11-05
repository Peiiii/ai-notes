import { useCrucibleStore } from '../stores/crucibleStore';
import * as crucibleAIService from '../services/crucibleAIService';
import { CrucibleSession, CrucibleContentBlock } from '../types';

export class CrucibleManager {
  startNewSession = async (topic: string) => {
    const newSession: CrucibleSession = {
      id: crypto.randomUUID(),
      topic,
      createdAt: Date.now(),
      divergentThoughts: [],
      reactorTerms: [],
      contentBlocks: [],
      isLoading: 'thoughts',
      expansionHistory: [],
    };
    
    useCrucibleStore.getState().addSession(newSession);
    useCrucibleStore.getState().setActiveSessionId(newSession.id);

    try {
      const thoughts = await crucibleAIService.generateDivergentThoughts(topic);
      useCrucibleStore.getState().updateSession(newSession.id, {
        divergentThoughts: thoughts,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to generate initial thoughts:", error);
      useCrucibleStore.getState().updateSession(newSession.id, { isLoading: false });
      throw error;
    }
  };
  
  addCustomThought = (sessionId: string, thought: string) => {
      const session = useCrucibleStore.getState().sessions.find(s => s.id === sessionId);
      if (session && !session.divergentThoughts.includes(thought)) {
          useCrucibleStore.getState().updateSession(sessionId, {
              divergentThoughts: [thought, ...session.divergentThoughts]
          });
      }
  };

  toggleReactorTerm = (sessionId: string, term: string) => {
    const session = useCrucibleStore.getState().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newReactorTerms = new Set(session.reactorTerms);
    if (newReactorTerms.has(term)) {
      newReactorTerms.delete(term);
    } else {
      newReactorTerms.add(term);
    }
    useCrucibleStore.getState().updateSession(sessionId, { reactorTerms: Array.from(newReactorTerms) });
  };
  
  addMultipleToReactor = (sessionId: string, terms: string[]) => {
    const session = useCrucibleStore.getState().sessions.find(s => s.id === sessionId);
    if (!session) return;
    const newReactorTerms = new Set([...session.reactorTerms, ...terms]);
    useCrucibleStore.getState().updateSession(sessionId, { reactorTerms: Array.from(newReactorTerms) });
  };

  expandSingleThought = async (sessionId: string, term: string) => {
    const { addExpansion, updateExpansion, removeExpansion } = useCrucibleStore.getState();
    const expansionId = crypto.randomUUID();

    addExpansion(sessionId, { id: expansionId, term, thoughts: [], isLoading: true });

    try {
      const thoughts = await crucibleAIService.generateDivergentThoughts(term);
      updateExpansion(sessionId, expansionId, { thoughts, isLoading: false });
    } catch (error) {
      console.error(`Failed to expand thought for "${term}":`, error);
      // Remove the loading card on error to avoid clutter
      removeExpansion(sessionId, expansionId);
    }
  };

  clearExpansionHistory = (sessionId: string) => {
    useCrucibleStore.getState().clearExpansionHistory(sessionId);
  };


  generateInitialStructure = async (sessionId: string) => {
    const { updateSession, addContentBlock, sessions } = useCrucibleStore.getState();
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.reactorTerms.length === 0) return;

    updateSession(sessionId, { isLoading: 'story' });
    try {
      const story = await crucibleAIService.generateStoryStructure(session.reactorTerms);
      const newBlock: CrucibleContentBlock = {
          id: crypto.randomUUID(),
          type: 'structure',
          content: story,
      };
      addContentBlock(sessionId, newBlock);
      // Also clear brainstorming state after generation to move to the next phase
      updateSession(sessionId, { 
        isLoading: false, 
        expansionHistory: [], 
      });
    } catch (error) {
      console.error("Failed to generate story structure:", error);
      updateSession(sessionId, { isLoading: false });
    }
  };
  
  getSuggestedActions = async (triggerText: string): Promise<string[]> => {
    try {
        return await crucibleAIService.suggestActions(triggerText);
    } catch (error) {
        console.error("Failed to get suggested actions:", error);
        return [];
    }
  };
  
  startExpansion = async (sessionId: string, parentBlockId: string, triggerText: string, prompt: string) => {
    // This function's logic would need a non-persistent task store to work correctly,
    // which has been removed for simplicity in this refactor.
    // For now, we'll just log that it was called.
    console.log(`Expansion triggered for session ${sessionId} with prompt: "${prompt}"`);
  };


  viewSession = (sessionId: string | null) => {
    useCrucibleStore.getState().setActiveSessionId(sessionId);
  };
  
  deleteSession = (sessionId: string) => {
    useCrucibleStore.getState().deleteSession(sessionId);
  };
}