import React from 'react';

export default function DashboardHeader({ user }) {
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Tableau de Bord</h1>
        <p className="dashboard-subtitle">Bienvenue {user?.email} 👋</p>
      </div>
      <div className="dashboard-date">
        {formatDate(new Date())}
      </div>
    </div>
  );
}
