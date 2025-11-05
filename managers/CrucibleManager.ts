import { useCrucibleStore } from '../stores/crucibleStore';
import * as crucibleAIService from '../services/crucibleAIService';
import { CrucibleSession, CrucibleContentBlock, CrucibleTask } from '../types';

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
      updateSession(sessionId, { isLoading: false });
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
    const { sessions, addTask, updateTask, addContentBlock } = useCrucibleStore.getState();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const task: CrucibleTask = {
        id: crypto.randomUUID(),
        status: 'loading',
        prompt,
        parentBlockId,
        triggerText,
    };
    addTask(task);

    try {
        const parentBlock = session.contentBlocks.find(b => b.id === parentBlockId);
        // For simplicity, we'll use a stringified version of the parent block as context
        const parentContent = parentBlock ? JSON.stringify(parentBlock.content) : '';
        const context = { parentContent, triggerText };

        const expansionContent = await crucibleAIService.generateExpansion(context, prompt);
        
        const newBlock: CrucibleContentBlock = {
            id: crypto.randomUUID(),
            type: 'expansion',
            content: expansionContent,
        };
        
        addContentBlock(sessionId, newBlock, parentBlockId);
        updateTask(task.id, { status: 'complete', result: 'Appended to flow.' });
        
        // Auto-remove successful tasks after a delay
        setTimeout(() => useCrucibleStore.getState().removeTask(task.id), 3000);

    } catch (error) {
        console.error("Failed to generate expansion:", error);
        updateTask(task.id, { status: 'error' });
    }
  };


  viewSession = (sessionId: string | null) => {
    useCrucibleStore.getState().setActiveSessionId(sessionId);
  };
  
  deleteSession = (sessionId: string) => {
    useCrucibleStore.getState().deleteSession(sessionId);
  };
}