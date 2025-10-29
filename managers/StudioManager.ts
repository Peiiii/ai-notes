import { useStudioStore } from '../stores/studioStore';
import { useNotesStore } from '../stores/notesStore';
import { Todo, KnowledgeCard, PulseReport, MindMapNode } from '../types';
import { generateSummary, generatePulseReport, generateMindMap } from '../services/aiService';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return hash.toString();
}

const PULSE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export class StudioManager {

    init = () => {
        // This can be called once when the app loads to check for auto-pulse
        const { lastPulseTimestamp } = useStudioStore.getState();
        const { notes } = useNotesStore.getState();
        const now = Date.now();
        const shouldAutoGenerate = !lastPulseTimestamp || (now - lastPulseTimestamp > PULSE_INTERVAL);
        
        if (shouldAutoGenerate && notes.length > 0) {
            console.log("Auto-generating weekly Pulse report...");
            this.generateNewPulseReport(true);
        }
    }

    generateNewSummary = async () => {
        const notes = useNotesStore.getState().notes;
        const { notesHashAtLastSummary, myTodos } = useStudioStore.getState();
        const currentNotesHash = simpleHash(JSON.stringify(notes));

        if (notes.length > 0 && currentNotesHash !== notesHashAtLastSummary) {
            useStudioStore.setState({ isLoadingAI: true });
            try {
                const rawSummary = await generateSummary(notes);
                const myTodoTexts = new Set(myTodos.map(t => t.text));

                const todosFromAI = rawSummary.todos || [];
                const knowledgeCardsFromAI = rawSummary.knowledgeCards || [];

                const suggestedTodos = todosFromAI
                    .filter(text => !myTodoTexts.has(text))
                    .map((text: string): Todo => ({
                        id: simpleHash(text),
                        text,
                        completed: false,
                    }));
                const knowledgeCardsWithIds = knowledgeCardsFromAI.map((card): KnowledgeCard => ({
                    ...card,
                    id: simpleHash(card.title + card.content),
                }));
                useStudioStore.setState({
                    aiSummary: {
                        todos: suggestedTodos,
                        knowledgeCards: knowledgeCardsWithIds,
                    },
                    notesHashAtLastSummary: currentNotesHash
                });
            } catch (error) {
                console.error(error);
                alert('Failed to analyze notes. Please check the console for details.');
            } finally {
                useStudioStore.setState({ isLoadingAI: false });
            }
        }
    }

    toggleTodo = (id: string) => {
        useStudioStore.setState(state => ({
            myTodos: state.myTodos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        }));
    }

    adoptTodo = (todoToAdopt: Todo, fromInsight: boolean = false) => {
        useStudioStore.setState(state => {
            // If it's not from an insight, it must come from the suggested list
            const updatedSuggestedTodos = fromInsight 
                ? state.aiSummary?.todos || []
                : state.aiSummary ? state.aiSummary.todos.filter(t => t.id !== todoToAdopt.id) : [];
            
            const newAiSummary = state.aiSummary ? { ...state.aiSummary, todos: updatedSuggestedTodos } : null;
            
            // Prevent adding duplicates
            if (state.myTodos.some(t => t.text === todoToAdopt.text)) {
                return { aiSummary: newAiSummary };
            }
            
            return {
                myTodos: [todoToAdopt, ...state.myTodos],
                aiSummary: newAiSummary
            };
        });
    }
    
    generateNewPulseReport = async (isAuto = false) => {
        useStudioStore.setState({ isLoadingPulse: true });
        try {
            const notes = useNotesStore.getState().notes;
            const reportData = await generatePulseReport(notes);
            const newReport: PulseReport = {
                id: crypto.randomUUID(),
                ...reportData,
                createdAt: Date.now(),
            };
            useStudioStore.setState(state => ({
                pulseReports: [newReport, ...state.pulseReports],
                lastPulseTimestamp: Date.now()
            }));
        } catch (error) {
            console.error("Pulse report generation failed:", error);
            if (!isAuto) {
                alert("Failed to generate Pulse Report. Please check the console for details.");
            }
        } finally {
            useStudioStore.setState({ isLoadingPulse: false });
        }
    }

    private addIdsToMindMapNode = (node: { label: string; children?: any[] }): MindMapNode => {
        const newNode: MindMapNode = {
            ...node,
            id: crypto.randomUUID(),
            children: node.children ? node.children.map(this.addIdsToMindMapNode) : [],
        };
        return newNode;
    }

    generateNewMindMap = async (force = false) => {
        const notes = useNotesStore.getState().notes;
        if (notes.length === 0) return;

        const { notesHashAtLastMindMap } = useStudioStore.getState();
        const currentNotesHash = simpleHash(JSON.stringify(notes));

        if (force || currentNotesHash !== notesHashAtLastMindMap) {
            useStudioStore.setState({ isLoadingMindMap: true });
            try {
                const rawMindMapData = await generateMindMap(notes);
                if (rawMindMapData && rawMindMapData.root) {
                    const mindMapDataWithIds = {
                        root: this.addIdsToMindMapNode(rawMindMapData.root),
                    };
                    useStudioStore.setState({
                        mindMapData: mindMapDataWithIds,
                        notesHashAtLastMindMap: currentNotesHash
                    });
                }
            } catch (error) {
                console.error("Mind map generation failed:", error);
                alert("Failed to generate Mind Map. Please check the console for details.");
            } finally {
                useStudioStore.setState({ isLoadingMindMap: false });
            }
        }
    }
}