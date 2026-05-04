import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutUser } from '../../services/api';
import DashboardHeader from './components/DashboardHeader';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div>
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Stats Section */}
      <StatsSection />

      {/* Charts Section */}
      <ChartsSection />

      {/* Activity & Actions */}
      <div className="content-grid-2col">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="card-title">📊 Activité Récente</h3>
          <div className="activity-list">
            {[
              { action: 'Conteneur #2847 vidé', time: 'Il y a 2h', status: '✅' },
              { action: 'Signalement #125 résolu', time: 'Il y a 4h', status: '✅' },
              { action: 'Zone 3 - Taux critique (89%)', time: 'Il y a 6h', status: '⚠️' },
              { action: 'Tournée Agent #12 complétée', time: 'Il y a 8h', status: '✅' },
            ].map((item, idx) => (
              <div key={idx} className="activity-item">
                <div>
                  <p className="activity-action">{item.action}</p>
                  <p className="activity-time">{item.time}</p>
                </div>
                <span className="activity-status">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="card-title">⚡ Actions Rapides</h3>
          <div className="actions-grid">
            <button className="action-btn action-btn-green">
              📍 Tournée
            </button>
            <button className="action-btn action-btn-blue">
              📢 Signalement
            </button>
            <button className="action-btn action-btn-purple">
              📊 Rapport
            </button>
            <button className="action-btn action-btn-orange">
              ⚙️ Paramètres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
