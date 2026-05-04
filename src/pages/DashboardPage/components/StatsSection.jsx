import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertCircle, TrendingUp } from 'lucide-react';
import StatCard from '../../../components/StatCard';
import { getContainers, getSignalements, getZones } from '../../../services/api';

export default function StatsSection() {
  const [stats, setStats] = useState({
    containers: 0,
    collections: 0,
    signalements: 0,
    fillRate: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      console.log('🔄 Fetching stats...');

      // Récupérer les données
      const containersData = await getContainers();
      const signalementsData = await getSignalements();
      const zonesData = await getZones();

      console.log('📦 Raw Containers Response:', containersData);
      console.log('📋 Raw Signalements Response:', signalementsData);
      console.log('🗺️ Raw Zones Response:', zonesData);

      // Traitement des données
      const containers = Array.isArray(containersData) ? containersData : containersData?.data || [];
      const signalements = Array.isArray(signalementsData) ? signalementsData : signalementsData?.data || [];
      const zones = Array.isArray(zonesData) ? zonesData : zonesData?.data || [];

      console.log('✅ Processed:', { 
        containers: containers.length, 
        signalements: signalements.length, 
        zones: zones.length 
      });
      console.log('📦 Containers sample:', containers.slice(0, 2));
      console.log('📋 Signalements sample:', signalements.slice(0, 2));

      // Calculer le taux de remplissage moyen
      const avgFillRate = containers.length > 0 
        ? Math.round(containers.reduce((sum, c) => sum + (c.fillLevel || 0), 0) / containers.length)
        : 0;

      setStats({
        containers: containers.length,
        collections: containers.filter(c => c.status === 'actif').length,
        signalements: signalements.filter(s => s.status === 'OUVERT' || s.status === 'pending').length,
        fillRate: avgFillRate,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('❌ Error fetching stats:', err.message);
      console.error('Full error:', err);
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
      <StatCard
        title="Conteneurs"
        value={stats.containers.toString()}
        icon={Package}
        color="green"
        trend={{ direction: 'up', value: 12 }}
        subtitle="Total actifs"
      />
      <StatCard
        title="Collectes"
        value={stats.collections.toString()}
        icon={Truck}
        color="blue"
        trend={{ direction: 'up', value: 8 }}
        subtitle="Cette semaine"
      />
      <StatCard
        title="Signalements"
        value={stats.signalements.toString()}
        icon={AlertCircle}
        color="orange"
        trend={{ direction: 'down', value: 5 }}
        subtitle="À traiter"
      />
      <StatCard
        title="Remplissage"
        value={`${stats.fillRate}%`}
        icon={TrendingUp}
        color="green"
        trend={{ direction: 'up', value: 3 }}
        subtitle="Moyenne zones"
      />
    </div>
  );
}
