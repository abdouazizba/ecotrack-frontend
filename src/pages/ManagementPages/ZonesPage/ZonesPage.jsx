import React from 'react';
import ZonesMapWithPanel from './components/ZonesMapWithPanel';

export default function ZonesPage() {
  return (
    <div className="dashboard-content">
      <div className="page-section">
        <div className="section-header">
          <div>
            <h1>Zones de Collecte</h1>
            <p>Visualiser et gérer les zones de collecte sur la carte interactive</p>
          </div>
        </div>
        <div className="section-content">
          <ZonesMapWithPanel />
        </div>
      </div>
    </div>
  );
}
