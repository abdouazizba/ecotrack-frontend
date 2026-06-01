import React from 'react';
import SignalementsKanban from './components/SignalementsKanban';

export default function SignalementsCitoyensPage() {
  return (
    <div className="page-content">
      <SignalementsKanban initialSource="citizen" title="Signalements des Citoyens" />
    </div>
  );
}
