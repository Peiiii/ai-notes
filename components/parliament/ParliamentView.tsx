

import React from 'react';
import { useParliamentStore } from '../../stores/parliamentStore';
import ParliamentHome from './ParliamentHome';
import ConversationView from './ConversationView';

const ParliamentView: React.FC = () => {
  const { activeSessionId } = useParliamentStore();

  if (activeSessionId) {
    return <ConversationView />;
  }
  
  return <ParliamentHome />;
};

export default ParliamentView;