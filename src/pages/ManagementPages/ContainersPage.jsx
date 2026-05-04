import React from 'react';
import ContainersSection from '../AdminPanel/components/ContainersSection';

export default function ContainersPage() {
  return (
    <div>
      <div className="admin-header">
        <h1>Gestion des Conteneurs</h1>
        <p className="admin-subtitle">Créer, modifier et supprimer les conteneurs</p>
      </div>

      <div className="admin-content">
        <ContainersSection />
      </div>
    </div>
  );
}
