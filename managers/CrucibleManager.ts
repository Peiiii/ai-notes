import { useCrucibleStore } from '../stores/crucibleStore';
import * as crucibleAIService from '../services/crucibleAIService';
import { CrucibleSession, CrucibleContentBlock, CrucibleStoryStructure, CrucibleTask } from '../types';

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
      tasks: [],
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
    const { sessions, addTask, updateTask } = useCrucibleStore.getState();
    const session = sessions.find(s => s.id === sessionId);
    const parentBlock = session?.contentBlocks.find(b => b.id === parentBlockId);

    if (!session || !parentBlock) {
        console.error("Could not find session or parent block for expansion.");
        return;
    }

    const newTaskId = crypto.randomUUID();
    const newTask: CrucibleTask = {
        id: newTaskId,
        status: 'loading',
        prompt,
        parentBlockId,
        triggerText,
    };

    addTask(sessionId, newTask);

    try {
        const storyToString = (s: CrucibleStoryStructure): string => {
            let text = `# ${s.title}\n\n**Logline:** ${s.logline}\n\n## Worldview\n${s.worldview}\n\n## Characters\n`;
            s.characters.forEach(c => { text += `### ${c.name}\n${c.description}\n\n`; });
            text += `## Outline\n### Act 1: ${s.outline.act_1.title}\n` + s.outline.act_1.plot_points.map(p => `- ${p}`).join('\n');
            text += `\n### Act 2: ${s.outline.act_2.title}\n` + s.outline.act_2.plot_points.map(p => `- ${p}`).join('\n');
            text += `\n### Act 3: ${s.outline.act_3.title}\n` + s.outline.act_3.plot_points.map(p => `- ${p}`).join('\n');
            return text;
        };

        const parentContent = typeof parentBlock.content === 'string'
            ? parentBlock.content
            : storyToString(parentBlock.content as CrucibleStoryStructure);

        const expansionContent = await crucibleAIService.generateExpansion({ parentContent, triggerText }, prompt);

        updateTask(sessionId, newTaskId, {
            status: 'complete',
            result: expansionContent,
        });
    } catch (error) {
        console.error("Failed to generate expansion:", error);
        updateTask(sessionId, newTaskId, {
            status: 'error',
            result: `> **Error:** Failed to generate expansion for prompt: "${prompt}"`,
        });
    }
  };

  acceptExpansionResult = (sessionId: string, taskId: string) => {
    const { sessions, addContentBlock, removeTask } = useCrucibleStore.getState();
    const session = sessions.find(s => s.id === sessionId);
    const task = session?.tasks.find(t => t.id === taskId);

    if (!session || !task || !task.result) return;
    
    const newBlock: CrucibleContentBlock = {
        id: crypto.randomUUID(),
        type: 'expansion',
        content: task.result,
    };

    addContentBlock(sessionId, newBlock, task.parentBlockId);
    removeTask(sessionId, taskId);
  };

  dismissTask = (sessionId: string, taskId: string) => {
      useCrucibleStore.getState().removeTask(sessionId, taskId);
  };


  viewSession = (sessionId: string | null) => {
    useCrucibleStore.getState().setActiveSessionId(sessionId);
  };
  
  deleteSession = (sessionId: string) => {
    useCrucibleStore.getState().deleteSession(sessionId);
  };
}