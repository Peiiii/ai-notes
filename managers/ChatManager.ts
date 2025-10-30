import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { useAgentStore } from '../stores/agentStore';
import { ChatMessage, Note, ChatSession, AIAgent, DiscussionMode } from '../types';
import { getAgentTextStream, generateThreadChatResponse, getModeratorResponse } from '../services/aiService';
import { NotesManager } from './NotesManager';

const discussionModeNames: Record<DiscussionMode, string> = {
    concurrent: 'Concurrent',
    turn_based: 'Turn-Based',
    moderated: 'Moderated',
};

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    createSession = (participantIds: string[], discussionMode: DiscussionMode): string => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => participantIds.includes(a.id));
        if (participants.length === 0) {
            throw new Error("Cannot create a session with no participants.");
        }

        const sessionName = this.generateSessionName(participants);

        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            name: sessionName,
            participantIds,
            history: [],
            createdAt: Date.now(),
            discussionMode,
        };

        useChatStore.setState(state => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newSession.id,
        }));
        
        return newSession.id;
    }
    
    addAgentsToSession = (sessionId: string, agentIdsToAdd: string[]) => {
        const { sessions, addMessage } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || agentIdsToAdd.length === 0) return;

        const { agents } = useAgentStore.getState();
        const newParticipantIds = [...new Set([...session.participantIds, ...agentIdsToAdd])];
        
        const agentsAdded = agents.filter(a => agentIdsToAdd.includes(a.id));
        if (agentsAdded.length === 0) return;

        const agentNames = agentsAdded.map(a => a.name).join(', ');
        const systemMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `${agentNames} ${agentsAdded.length > 1 ? 'have' : 'has'} joined the conversation.`
        };
        
        const newParticipants = agents.filter(a => newParticipantIds.includes(a.id));
        const newSessionName = this.generateSessionName(newParticipants);

        useChatStore.getState().updateSession(sessionId, { participantIds: newParticipantIds, name: newSessionName });
        addMessage(sessionId, systemMessage);
    }

    updateSessionMode = (sessionId: string, newMode: DiscussionMode) => {
        const { sessions, updateSession, addMessage } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || session.discussionMode === newMode) return;

        updateSession(sessionId, { discussionMode: newMode });
        
        const modeName = discussionModeNames[newMode] || newMode;
        const systemMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Discussion mode has been changed to ${modeName}.`
        };
        addMessage(sessionId, systemMessage);
    }

    private generateSessionName = (participants: AIAgent[]): string => {
        if (participants.length === 0) return "Empty Chat";
        if (participants.length === 1) return `Chat with ${participants[0].name}`;
        
        const nameList = participants.map(p => p.name);
        if (participants.length <= 2) {
            return nameList.join(' & ');
        }
        
        return `${nameList.slice(0, 2).join(', ')} + ${participants.length - 2} more`;
    }

    sendMessageInSession = async (sessionId: string, message: string) => {
        const { sessions } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || !message.trim()) return;

        const isCurrentlyStreaming = session.history.some(m => m.status === 'thinking' || m.status === 'streaming');
        if (isCurrentlyStreaming) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            persona: 'User',
            status: 'complete',
        };

        useChatStore.getState().addMessage(sessionId, userMessage);
        
        switch (session.discussionMode) {
            case 'turn_based':
                await this._handleTurnBasedMessage(session, userMessage);
                break;
            case 'moderated':
                await this._handleModeratedMessage(session, userMessage);
                break;
            case 'concurrent':
            default:
                await this._handleConcurrentMessage(session, userMessage);
                break;
        }
    }

    private _handleConcurrentMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        const conversationHistoryForAI = [...session.history, userMessage].filter(m => m.role !== 'system');
        
        const modelPlaceholders: ChatMessage[] = participants.map(agent => ({
            id: crypto.randomUUID(),
            role: 'model',
            content: '',
            persona: agent.name,
            status: 'thinking',
        }));
        useChatStore.getState().addMessages(session.id, modelPlaceholders);

        const responsePromises = participants.map(async (agent, index) => {
            const placeholderId = modelPlaceholders[index].id;
            try {
                const stream = await getAgentTextStream(conversationHistoryForAI, agent.systemInstruction);
                
                let firstChunk = true;
                for await (const chunk of stream) {
                    if (firstChunk) {
                        useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'streaming');
                        firstChunk = false;
                    }
                    useChatStore.getState().appendContentToMessage(session.id, placeholderId, chunk.text || '');
                }
                useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'complete');
            } catch (error) {
                console.error(`Error from agent ${agent.name}:`, error);
                useChatStore.getState().updateMessage(session.id, placeholderId, {
                    content: `Sorry, I encountered an error.`,
                    status: 'error',
                });
            }
        });

        await Promise.all(responsePromises);
    }
    
    private _handleTurnBasedMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        
        let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');

        for (const agent of participants) {
            const placeholderId = crypto.randomUUID();
            const placeholderMessage: ChatMessage = {
                id: placeholderId, role: 'model', content: '', persona: agent.name, status: 'thinking'
            };
            useChatStore.getState().addMessage(session.id, placeholderMessage);

            try {
                const stream = await getAgentTextStream(turnHistory, agent.systemInstruction);
                
                let firstChunk = true;
                let fullResponse = "";
                for await (const chunk of stream) {
                    if (firstChunk) {
                        useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'streaming');
                        firstChunk = false;
                    }
                    const textChunk = chunk.text || '';
                    useChatStore.getState().appendContentToMessage(session.id, placeholderId, textChunk);
                    fullResponse += textChunk;
                }
                useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'complete');

                turnHistory.push({ ...placeholderMessage, content: fullResponse, status: 'complete' });

            } catch (error) {
                console.error(`Error from agent ${agent.name} in turn-based mode:`, error);
                useChatStore.getState().updateMessage(session.id, placeholderId, {
                    content: `Sorry, I encountered an error.`,
                    status: 'error',
                });
                break; // Stop the sequence on error
            }
        }
    }

    private _handleModeratedMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        const participantNames = participants.map(p => p.name);
        
        let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');
        const spokenAgentNames = new Set<string>();
        let turns = 0;
        const MAX_TURNS = participants.length + 2; // Prevent infinite loops

        while (turns < MAX_TURNS) {
            turns++;
            const moderatorResponse = await getModeratorResponse(turnHistory, participantNames, Array.from(spokenAgentNames));
            const toolCall = moderatorResponse.toolCalls?.[0];

            if (!toolCall || toolCall.name === 'end_discussion') {
                const summary = toolCall?.args.summary || "The discussion has concluded.";
                const systemMessage: ChatMessage = {
                    id: crypto.randomUUID(), role: 'system', content: `[Moderator]: ${summary}`
                };
                useChatStore.getState().addMessage(session.id, systemMessage);
                break;
            }

            if (toolCall.name === 'select_next_speaker') {
                const agentName = toolCall.args.agent_name as string;
                const reason = toolCall.args.reason as string;
                const nextAgent = participants.find(p => p.name === agentName);
                
                if (!nextAgent) {
                    console.warn(`Moderator chose an invalid agent: ${agentName}`);
                    continue;
                }
                
                const reasonMessage: ChatMessage = {
                    id: crypto.randomUUID(), role: 'system', content: `[Moderator chose ${agentName}]: ${reason}`
                };
                useChatStore.getState().addMessage(session.id, reasonMessage);

                const placeholderId = crypto.randomUUID();
                const placeholderMessage: ChatMessage = {
                    id: placeholderId, role: 'model', content: '', persona: nextAgent.name, status: 'thinking'
                };
                useChatStore.getState().addMessage(session.id, placeholderMessage);

                try {
                    const stream = await getAgentTextStream(turnHistory, nextAgent.systemInstruction);
                    let fullResponse = "";
                    let firstChunk = true;
                    for await (const chunk of stream) {
                        if (firstChunk) {
                            useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'streaming');
                            firstChunk = false;
                        }
                        const textChunk = chunk.text || '';
                        useChatStore.getState().appendContentToMessage(session.id, placeholderId, textChunk);
                        fullResponse += textChunk;
                    }
                    useChatStore.getState().updateMessageStatus(session.id, placeholderId, 'complete');
                    turnHistory.push({ ...placeholderMessage, content: fullResponse, status: 'complete' });
                    spokenAgentNames.add(nextAgent.name);

                } catch (error) {
                    console.error(`Error from agent ${nextAgent.name} in moderated mode:`, error);
                    useChatStore.getState().updateMessage(session.id, placeholderId, {
                        content: `Sorry, I encountered an error.`, status: 'error'
                    });
                    break;
                }
            }
        }
    }

    sendThreadChatMessage = async (noteId: string, message: string) => {
        if (!message.trim()) return;

        const note = useNotesStore.getState().notes.find(n => n.id === noteId);
        if (!note) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
        };

        useChatStore.setState({ isThreadChatting: true });
        this.notesManager.appendThreadMessage(noteId, userMessage);

        try {
            const updatedNote = useNotesStore.getState().notes.find(n => n.id === noteId)!;
            const responseContent = await generateThreadChatResponse(updatedNote, message);
            
            const modelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: responseContent,
            };
            this.notesManager.appendThreadMessage(noteId, modelMessage);

        } catch (error) {
            console.error("Thread chat failed:", String(error));
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Sorry, I encountered an error. Please try again.",
            };
            this.notesManager.appendThreadMessage(noteId, errorMessage);
        } finally {
            useChatStore.setState({ isThreadChatting: false });
        }
    };
}
