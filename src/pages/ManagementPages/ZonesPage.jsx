import React from 'react';
import ZonesSection from '../AdminPanel/components/ZonesSection';
import ZonesMap from './components/ZonesMap';

export default function ZonesPage() {
  return (
    <div>
      <div className="admin-header">
        <h1>Gestion des Zones</h1>
        <p className="admin-subtitle">Créer, modifier et supprimer les zones de collecte</p>
      </div>

      <div className="admin-content">
        {/* Map View */}
        <ZonesMap />

        {/* Management Table */}
        <ZonesSection />
      </div>
    </div>
  );
}
