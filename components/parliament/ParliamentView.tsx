
import React from 'react';
import { Note, ChatMessage } from '../../types';
import ParliamentHome from './ParliamentHome';
import DebateTranscript from './DebateTranscript';

interface ParliamentViewProps {
  notes: Note[];
  topics: string[];
  isLoadingTopics: boolean;
  debateHistory: ChatMessage[];
  isDebating: boolean;
  currentDebate: { topic: string; noteId?: string } | null;
  onStartDebate: (topic: string, noteId?: string) => void;
  onResetDebate: () => void;
}

const ParliamentView: React.FC<ParliamentViewProps> = (props) => {
  const { currentDebate } = props;

  if (currentDebate) {
    return <DebateTranscript {...props} />;
  }
  
  return <ParliamentHome {...props} />;
};

export default ParliamentView;
