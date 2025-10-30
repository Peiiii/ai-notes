import { IDiscussionStrategy } from './IDiscussionStrategy';
import { ChatSession, ChatMessage, AIAgent } from '../../types';
import { ChatManager } from '../ChatManager';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';
import { getModeratorResponse } from '../../services/agentAIService';

export class ModeratedStrategy implements IDiscussionStrategy {
  public async handleMessage(
    manager: ChatManager,
    session: ChatSession,
    userMessage: ChatMessage,
    mentionedAgents: AIAgent[]
  ): Promise<void> {
    const { agents } = useAgentStore.getState();
    const participants = agents.filter(a => session.participantIds.includes(a.id));
    const participantNames = participants.map(p => p.name);
    
    let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');
    const spokenAgentNames = new Set<string>();
    let turns = 0;
    const MAX_TURNS = participants.length + 3; // Prevent infinite loops

    while (turns < MAX_TURNS) {
        turns++;
        const mentionedAgentNames = mentionedAgents.map(a => a.name);
        const moderatorResponse = await getModeratorResponse(turnHistory, participantNames, Array.from(spokenAgentNames), mentionedAgentNames);
        const toolCall = moderatorResponse.toolCalls?.[0];

        if (!toolCall || toolCall.name === 'pass_control_to_user') {
            const reason = toolCall?.args.reason || "The discussion goal has been met.";
            const systemMessage: ChatMessage = {
                id: crypto.randomUUID(), role: 'system', content: `[Moderator]: ${reason}`
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

            try {
                const newMessages = await manager._runAgentTurn(nextAgent, turnHistory, session.id, participantNames);
                turnHistory.push(...newMessages);
                spokenAgentNames.add(nextAgent.name);
            } catch (error) {
                console.error(`Error during agent ${nextAgent.name}'s turn:`, error);
                // Error message is already added inside _runAgentTurn, so we just break the loop.
                break;
            }
        }
    }
  }
}
