import React from 'react';
import ContainersSection from './components/ContainersSection';

export default function ContainersPage() {
  return (
    <div className="dashboard-content">
      <div className="page-section">
        <div className="section-header">
          <div>
            <h1>Gestion des Conteneurs</h1>
            <p>Créer, modifier et supprimer les conteneurs</p>
          </div>
        </div>
        <div className="section-content">
          <ContainersSection />
        </div>
      </div>
    </div>
  );
}
