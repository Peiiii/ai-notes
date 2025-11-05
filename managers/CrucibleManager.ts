import { useCrucibleStore } from '../stores/crucibleStore';
import * as crucibleAIService from '../services/crucibleAIService';
import { CrucibleSession, ConceptOperator } from '../types';

export class CrucibleManager {
  startNewSession = async (topic: string) => {
    const newSession: CrucibleSession = {
      id: crypto.randomUUID(),
      topic,
      createdAt: Date.now(),
      divergentThoughts: [],
      reactorTerms: [],
      storyStructure: null,
      isLoading: 'thoughts',
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

  expandConcepts = async (sessionId: string, terms: string[], operator: ConceptOperator) => {
    const { updateSession } = useCrucibleStore.getState();
    updateSession(sessionId, { isLoading: 'expansion' });

    try {
      const newThoughts = await crucibleAIService.expandWithOperator(terms, operator);
      const session = useCrucibleStore.getState().sessions.find(s => s.id === sessionId);
      if (session) {
        const combinedThoughts = [...new Set([...session.divergentThoughts, ...newThoughts])];
        updateSession(sessionId, { divergentThoughts: combinedThoughts, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to expand concepts:", error);
      updateSession(sessionId, { isLoading: false });
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

  generateStory = async (sessionId: string) => {
    const { updateSession, sessions } = useCrucibleStore.getState();
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.reactorTerms.length === 0) return;

    updateSession(sessionId, { isLoading: 'story' });
    try {
      const story = await crucibleAIService.generateStoryStructure(session.reactorTerms);
      updateSession(sessionId, { storyStructure: story, isLoading: false });
    } catch (error) {
      console.error("Failed to generate story:", error);
      updateSession(sessionId, { isLoading: false });
    }
  };

  viewSession = (sessionId: string | null) => {
    useCrucibleStore.getState().setActiveSessionId(sessionId);
  };
  
  deleteSession = (sessionId: string) => {
    useCrucibleStore.getState().deleteSession(sessionId);
  };
}
