
import { useInsightStore } from '../stores/insightStore';
import { useNotesStore } from '../stores/notesStore';
import { useStudioStore } from '../stores/studioStore';
import { Insight, Note } from '../types';
import { getLiveInsights } from '../services/insightAIService';
import { searchNotesInCorpus } from '../services/agentAIService';

export class InsightManager {
  private currentRequest: Promise<void> | null = null;

  getInsightsForNote = async (noteContent: string, currentNoteId: string) => {
    const snippet = noteContent.slice(-500); // Analyze the last 500 characters
    if (snippet.length < 40) { // Don't run on very short text
      useInsightStore.setState({ insights: [], isLoadingInsights: false });
      return;
    }
    
    // Prevent concurrent requests
    if (this.currentRequest) {
        return;
    }
    
    const requestPromise = (async () => {
        useInsightStore.setState({ isLoadingInsights: true, insights: [] });
        try {
            const allNotes = useNotesStore.getState().notes.filter(n => n.id !== currentNoteId);
            if (allNotes.length === 0) {
                 useInsightStore.setState({ isLoadingInsights: false });
                 return;
            }

            const response = await getLiveInsights(snippet, allNotes);
            const insights: Insight[] = [];

            if (response.toolCalls) {
                for (const call of response.toolCalls) {
                    if (call.name === 'find_related_notes' && call.args.topic) {
                        const relatedNotes = await searchNotesInCorpus(call.args.topic as string, allNotes);
                        if (relatedNotes.length > 0) {
                            const note = relatedNotes[0]; // Take the most relevant one
                            insights.push({
                                id: `insight-note-${note.id}`,
                                type: 'related_note',
                                title: 'Related Note',
                                content: note.title,
                                sourceNoteId: note.id,
                            });
                        }
                    } else if (call.name === 'identify_action_item' && call.args.task) {
                        const myTodos = useStudioStore.getState().myTodos;
                        if (!myTodos.some(todo => todo.text.includes(call.args.task as string))) {
                            insights.push({
                                id: `insight-todo-${crypto.randomUUID()}`,
                                type: 'action_item',
                                title: 'Suggested To-Do',
                                content: call.args.task as string,
                            });
                        }
                    } else if (call.name === 'identify_wiki_concept' && call.args.term) {
                        insights.push({
                            id: `insight-wiki-${crypto.randomUUID()}`,
                            type: 'wiki_concept',
                            title: 'New Wiki Concept',
                            content: call.args.term as string,
                        });
                    }
                }
            }
            useInsightStore.setState({ insights, isLoadingInsights: false });
        } catch (error) {
            console.error("Failed to get live insights:", String(error));
            useInsightStore.setState({ isLoadingInsights: false, insights: [] });
        } finally {
            this.currentRequest = null;
        }
    })();
    
    this.currentRequest = requestPromise;
    await requestPromise;
  };
}
