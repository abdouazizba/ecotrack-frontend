import React from 'react';
import UsersSection from '../AdminPanel/components/UsersSection';

export default function UsersPage() {
  return (
    <div>
      <div className="admin-header">
        <h1>Gestion des Utilisateurs</h1>
        <p className="admin-subtitle">Créer, modifier et gérer les utilisateurs et leurs rôles</p>
      </div>

      <div className="admin-content">
        <UsersSection />
      </div>
    </div>
  );
}
