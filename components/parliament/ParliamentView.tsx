import React from 'react';
import { Note, ChatMessage, DebateSynthesis, ParliamentMode } from '../../types';
import ParliamentHome from './ParliamentHome';
import ConversationView from './ConversationView';

interface ParliamentViewProps {
  notes: Note[];
  topics: string[];
  isLoadingTopics: boolean;
  sessionHistory: ChatMessage[];
  isSessionActive: boolean;
  currentSession: { 
    mode: ParliamentMode;
    topic: string;
    noteId?: string 
  } | null;
  onStartDebate: (topic: string, noteId?: string) => void;
  onStartPodcast: (topic: string, noteId?: string) => void;
  onResetSession: () => void;
  onSaveSynthesis: (topic: string, synthesis: DebateSynthesis) => void;
}

const ParliamentView: React.FC<ParliamentViewProps> = (props) => {
  const { currentSession } = props;

  if (currentSession) {
    return <ConversationView {...props} />;
  }
  
  return <ParliamentHome {...props} />;
};

export default ParliamentView;