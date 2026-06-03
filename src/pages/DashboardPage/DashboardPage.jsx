import React from 'react';
import useDashboardData from '../../hooks/useDashboardData';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import './DashboardPage.css';

export default function DashboardPage() {
  const dashData = useDashboardData();

  return (
    <div className="dashboard-content">
      <div className="analytics-section">
        <StatsSection {...dashData} />
      </div>
      <div className="charts-wrapper">
        <ChartsSection {...dashData} />
      </div>
    </div>
  );
}
