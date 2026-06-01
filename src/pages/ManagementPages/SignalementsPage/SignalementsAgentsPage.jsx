import React from 'react';
import SignalementsKanban from './components/SignalementsKanban';

export default function SignalementsAgentsPage() {
  return (
    <div className="page-content">
      <SignalementsKanban initialSource="agent" title="Signalements des Agents" />
    </div>
  );
}
