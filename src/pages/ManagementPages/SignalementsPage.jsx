import React from 'react';
import SignalementsSection from '../AdminPanel/components/SignalementsSection';

export default function SignalementsPage() {
  return (
    <div>
      <div className="admin-header">
        <h1>Gestion des Signalements</h1>
        <p className="admin-subtitle">Visualiser, modifier et gérer les signalements</p>
      </div>

      <div className="admin-content">
        <SignalementsSection />
      </div>
    </div>
  );
}
