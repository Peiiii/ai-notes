import { IDiscussionStrategy } from './IDiscussionStrategy';
import { ChatSession, ChatMessage, AIAgent } from '../../types';
import { ChatManager } from '../ChatManager';
import { useAgentStore } from '../../stores/agentStore';

export class TurnBasedStrategy implements IDiscussionStrategy {
  public async handleMessage(
    manager: ChatManager,
    session: ChatSession,
    userMessage: ChatMessage,
    mentionedAgents: AIAgent[]
  ): Promise<void> {
    const { agents } = useAgentStore.getState();
    const allParticipants = agents.filter(a => session.participantIds.includes(a.id));
    const respondingAgents = mentionedAgents.length > 0 ? mentionedAgents : allParticipants;
    const participantNames = allParticipants.map(p => p.name);
    
    let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');

    for (const agent of respondingAgents) {
        try {
            const newMessages = await manager._runAgentTurn(agent, turnHistory, session.id, participantNames);
            turnHistory.push(...newMessages);
        } catch (error) {
             console.error(`Error from agent ${agent.name} in turn-based mode:`, error);
             // The error message is already added inside _runAgentTurn
             break; // Stop the sequence on error
        }
    }
  }
}
