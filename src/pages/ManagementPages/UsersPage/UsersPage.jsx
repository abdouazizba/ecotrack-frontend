import React from 'react';
import UsersSection from './components/UsersSection';

export default function UsersPage() {
  return (
    <div className="dashboard-content">
      <div className="page-section">
        <div className="section-header">
          <div>
            <h1>Gestion des Utilisateurs</h1>
            <p>Créer, modifier et gérer les utilisateurs et leurs rôles</p>
          </div>
        </div>
        <div className="section-content">
          <UsersSection />
        </div>
      </div>
    </div>
  );
}
