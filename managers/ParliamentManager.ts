
import { useParliamentStore } from '../stores/parliamentStore';
import { useNotesStore } from '../stores/notesStore';
import { ChatMessage } from '../types';
import { generateDebateTopics, generateDebateTurn, generateDebateSynthesis } from '../services/parliamentAIService';

const PERSONAS = [
    {
        name: 'The Pragmatist',
        definition: "You are The Pragmatist. You are grounded, data-driven, and skeptical of grand, unproven ideas. You focus on immediate realities, practical applications, and potential risks. Your arguments should be logical and backed by evidence (even if hypothetical within the context of the user's notes)."
    },
    {
        name: 'The Visionary',
        definition: "You are The Visionary. You are creative, forward-thinking, and optimistic about future possibilities. You focus on long-term potential, abstract connections, and innovative concepts. Your arguments should be imaginative and explore the 'what if' scenarios."
    }
];

const MAX_TURNS = 6; // 3 turns per persona

export class ParliamentManager {

    fetchTopics = async () => {
        const { notes } = useNotesStore.getState();
        useParliamentStore.setState({ isLoadingTopics: true });
        try {
            const topics = await generateDebateTopics(notes);
            useParliamentStore.setState({ topics });
        } catch (error) {
            console.error("Failed to fetch debate topics", error);
        } finally {
            useParliamentStore.setState({ isLoadingTopics: false });
        }
    }

    startDebate = async (topic: string, noteId?: string) => {
        if (useParliamentStore.getState().isDebating) return;

        this.resetDebate();

        useParliamentStore.setState({
            isDebating: true,
            currentDebate: { topic, noteId },
        });

        const noteContent = noteId ? useNotesStore.getState().notes.find(n => n.id === noteId)?.content : undefined;

        this.runDebateLoop(topic, noteContent);
    }
    
    private runDebateLoop = async (topic: string, noteContent?: string) => {
        try {
            for (let i = 0; i < MAX_TURNS; i++) {
                const currentPersona = PERSONAS[i % 2];
                const history = useParliamentStore.getState().debateHistory;
                
                // Add a small delay for a more natural feel, except for the first turn
                if (i > 0) {
                    await new Promise(res => setTimeout(res, 2000));
                }
                
                const responseContent = await generateDebateTurn(topic, history, currentPersona.definition, i === 0 ? noteContent : undefined);

                const turnMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: responseContent,
                    persona: currentPersona.name,
                };
                
                useParliamentStore.setState(state => ({
                    debateHistory: [...state.debateHistory, turnMessage]
                }));
            }

            // Conclude the debate with a synthesis
            await new Promise(res => setTimeout(res, 1500));
            const finalHistory = useParliamentStore.getState().debateHistory;
            const synthesis = await generateDebateSynthesis(topic, finalHistory);

            const synthesisMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Here is a synthesis of the discussion.", // Fallback text
                persona: "Moderator",
                synthesisContent: synthesis,
            };
            useParliamentStore.setState(state => ({
                debateHistory: [...state.debateHistory, synthesisMessage]
            }));

        } catch (error) {
            console.error("Debate failed:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "An error occurred during the debate. Please try again.",
                persona: "Moderator"
            };
            useParliamentStore.setState(state => ({
                debateHistory: [...state.debateHistory, errorMessage]
            }));
        } finally {
            useParliamentStore.setState({ isDebating: false });
        }
    }

    resetDebate = () => {
        useParliamentStore.setState({
            debateHistory: [],
            isDebating: false,
            currentDebate: null,
        });
    }
}