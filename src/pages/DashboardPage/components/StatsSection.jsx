import React, { useState, useEffect } from 'react';
import EchartsStatCard from '../../../components/EchartsStatCard';
import { getContainers, getSignalements, getZones } from '../../../services/api';

export default function StatsSection() {
  const [stats, setStats] = useState({
    containers: 0,
    zones: 0,
    signalements: 0,
    fillRate: 0,
    criticalContainers: 0,
    activeZones: 0,
    openAlerts: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const containersData = await getContainers();
      const signalementsData = await getSignalements();
      const zonesData = await getZones();

      const containers = Array.isArray(containersData) ? containersData : containersData?.data || [];
      const signalements = Array.isArray(signalementsData) ? signalementsData : signalementsData?.data || [];
      const zones = Array.isArray(zonesData) ? zonesData : zonesData?.data || [];

      const validContainers = containers.filter(c => c.fillLevel !== null && c.fillLevel !== undefined);
      const avgFillRate = validContainers.length > 0 
        ? Math.round(validContainers.reduce((sum, c) => sum + (c.fillLevel || 0), 0) / validContainers.length)
        : 0;

      const criticalContainers = containers.filter(c => (c.fillLevel || 0) > 80).length;
      const activeZones = zones.filter(z => z.status === 'active').length;
      const openSignalements = signalements.filter(s => 
        s.status === 'OUVERT' || s.status === 'pending' || s.status === 'open'
      ).length;

      setStats({
        containers: containers.length,
        zones: zones.length,
        signalements: openSignalements,
        fillRate: avgFillRate,
        criticalContainers: criticalContainers,
        activeZones: activeZones,
        openAlerts: Math.max(criticalContainers, openSignalements),
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('❌ Error fetching stats:', err.message);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: `Erreur: ${err.message}`,
      }));
    }
  };

  return (
    <div className="stats-grid">
      {stats.error && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '16px',
          backgroundColor: '#fee2e2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#991b1b',
          fontWeight: 'bold'
        }}>
          ❌ {stats.error}
        </div>
      )}
      <EchartsStatCard
        title="Conteneurs"
        value={stats.containers.toString()}
        type="bar"
        color="#0284c7"
        trend={{ direction: 'up', value: 2 }}
        subtitle="Total en service"
      />
      <EchartsStatCard
        title="Zones"
        value={stats.zones.toString()}
        type="line"
        color="#16a34a"
        trend={{ direction: 'up', value: 1 }}
        subtitle={`${stats.activeZones} actives`}
      />
      <EchartsStatCard
        title="Signalements"
        value={stats.signalements.toString()}
        type="bar"
        color="#f59e0b"
        trend={{ direction: 'down', value: 3 }}
        subtitle="À traiter"
      />
      <EchartsStatCard
        title="Remplissage Moyen"
        value={stats.fillRate.toString()}
        type="gauge"
        color={stats.fillRate > 80 ? '#ef4444' : '#16a34a'}
        trend={{ direction: stats.fillRate > 50 ? 'up' : 'down', value: Math.abs(stats.fillRate - 50) }}
        subtitle="Tous conteneurs"
      />
      <EchartsStatCard
        title="Conteneurs Critiques"
        value={stats.criticalContainers.toString()}
        type="pie"
        color="#ef4444"
        trend={{ direction: 'down', value: 15 }}
        subtitle="Remplissage > 80%"
      />
      <EchartsStatCard
        title="Alertes Ouvertes"
        value={stats.openAlerts.toString()}
        type="line"
        color="#f59e0b"
        trend={{ direction: 'down', value: 25 }}
        subtitle="En attente de résolution"
      />
    </div>
  );
}
