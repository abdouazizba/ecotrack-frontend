import React from 'react';

export default function DashboardHeader({ user, title = 'Tableau de Bord' }) {
  const getInitials = (email) => {
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-title">
        <h1>{title}</h1>
      </div>

      <div className="dashboard-header-user">
        <div className="user-greeting">
          <span className="user-greeting-name">Bienvenue {user?.email}</span>
          <span className="user-greeting-role">👋</span>
        </div>
        <div className="user-avatar">
          {getInitials(user?.email)}
        </div>
      </div>
    </div>
  );
}
