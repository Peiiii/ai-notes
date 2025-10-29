import { useParliamentStore } from '../stores/parliamentStore';
import { useNotesStore } from '../stores/notesStore';
import { ChatMessage } from '../types';
import { 
    generateDebateTopics, 
    generateDebateTurn, 
    generateDebateSynthesis,
    generatePodcastTurn
} from '../services/parliamentAIService';

const DEBATE_PERSONAS = [
    {
        name: 'The Pragmatist',
        definition: "You are The Pragmatist. You are grounded, data-driven, and skeptical of grand, unproven ideas. You focus on immediate realities, practical applications, and potential risks. Your arguments should be logical and backed by evidence (even if hypothetical within the context of the user's notes)."
    },
    {
        name: 'The Visionary',
        definition: "You are The Visionary. You are creative, forward-thinking, and optimistic about future possibilities. You focus on long-term potential, abstract connections, and innovative concepts. Your arguments should be imaginative and explore the 'what if' scenarios."
    }
] as const;


const MAX_DEBATE_TURNS = 6; // 3 turns per persona
const PODCAST_EXCHANGES = 3; // 1 intro, 1 greeting, 3 Q&A pairs, 1 outro = 9 turns total

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
        if (useParliamentStore.getState().isSessionActive) return;

        this.resetSession();

        useParliamentStore.setState({
            isSessionActive: true,
            currentSession: { mode: 'debate', topic, noteId },
        });

        const noteContent = noteId ? useNotesStore.getState().notes.find(n => n.id === noteId)?.content : undefined;

        this.runDebateLoop(topic, noteContent);
    }

    startPodcast = async (topic: string, noteId?: string) => {
        if (useParliamentStore.getState().isSessionActive) return;

        this.resetSession();
        
        useParliamentStore.setState({
            isSessionActive: true,
            currentSession: { mode: 'podcast', topic, noteId },
        });

        const noteContent = noteId ? useNotesStore.getState().notes.find(n => n.id === noteId)?.content : undefined;
        
        this.runPodcastLoop(topic, noteContent);
    }
    
    private runDebateLoop = async (topic: string, noteContent?: string) => {
        try {
            for (let i = 0; i < MAX_DEBATE_TURNS; i++) {
                const currentPersona = DEBATE_PERSONAS[i % 2];
                const history = useParliamentStore.getState().sessionHistory;
                
                if (i > 0) await new Promise(res => setTimeout(res, 2000));
                
                const responseContent = await generateDebateTurn(topic, history, currentPersona.definition, i === 0 ? noteContent : undefined);

                const turnMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: responseContent,
                    persona: currentPersona.name,
                };
                
                useParliamentStore.setState(state => ({
                    sessionHistory: [...state.sessionHistory, turnMessage]
                }));
            }

            await new Promise(res => setTimeout(res, 1500));
            const finalHistory = useParliamentStore.getState().sessionHistory;
            const synthesis = await generateDebateSynthesis(topic, finalHistory);

            const synthesisMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Here is a synthesis of the discussion.",
                persona: "Moderator",
                synthesisContent: synthesis,
            };
            useParliamentStore.setState(state => ({
                sessionHistory: [...state.sessionHistory, synthesisMessage]
            }));

        } catch (error) {
            this.handleError(error, "Debate failed:");
        } finally {
            useParliamentStore.setState({ isSessionActive: false });
        }
    }

    private runPodcastLoop = async (topic: string, noteContent?: string) => {
        try {
            // Intro
            await this.addPodcastTurn(topic, 'Host', 'intro', noteContent);
            
            // Guest Greeting
            await this.addPodcastTurn(topic, 'Guest Expert', 'greeting');
            
            // Discussion
            for (let i = 0; i < PODCAST_EXCHANGES; i++) {
                await this.addPodcastTurn(topic, 'Host', 'question');
                await this.addPodcastTurn(topic, 'Guest Expert', 'answer');
            }

            // Outro
            await this.addPodcastTurn(topic, 'Host', 'outro');

        } catch (error) {
            this.handleError(error, "Podcast generation failed:");
        } finally {
            useParliamentStore.setState({ isSessionActive: false });
        }
    }

    private addPodcastTurn = async (
        topic: string,
        persona: 'Host' | 'Guest Expert',
        turnType: 'intro' | 'question' | 'answer' | 'outro' | 'greeting',
        noteContext?: string
    ) => {
        await new Promise(res => setTimeout(res, 2500));
        const history = useParliamentStore.getState().sessionHistory;
        const responseContent = await generatePodcastTurn(topic, history, persona, turnType, noteContext);
        
        const turnMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            content: responseContent,
            persona: persona,
        };
        useParliamentStore.setState(state => ({
            sessionHistory: [...state.sessionHistory, turnMessage]
        }));
    };

    private handleError = (error: unknown, message: string) => {
        console.error(message, error);
        const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            content: "An error occurred during the session. Please try again.",
            persona: "Moderator"
        };
        useParliamentStore.setState(state => ({
            sessionHistory: [...state.sessionHistory, errorMessage]
        }));
    }

    resetSession = () => {
        useParliamentStore.setState({
            sessionHistory: [],
            isSessionActive: false,
            currentSession: null,
        });
    }
}