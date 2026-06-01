import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !user.email) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="dashboard-content">
      {/* Stats Section */}
      <div className="analytics-section">
        <StatsSection />
      </div>

      {/* Charts Section */}
      <div className="charts-wrapper">
        <ChartsSection />
      </div>
    </div>
  );
}
