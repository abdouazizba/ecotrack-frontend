import { useState, useEffect, useCallback } from 'react';
import { getContainers, getSignalements, getZones, getAgents, getCapteurs, getDashboardStats, getContainersNeedingService, getTournees, getContainerStatsDashboard, getTourStatsDashboard } from '../services/api';
import { enrichContainersWithSensors } from '../services/transformers';

const REFRESH_INTERVAL = 30000;

export default function useDashboardData() {
  const [state, setState] = useState({
    containers: [],
    signalements: [],
    zones: [],
    agents: [],
    tournees: [],
    criticalContainers: [],
    dashboardStats: {},
    loading: true,
    error: null,
  });

  const load = useCallback(() => {
    Promise.allSettled([getContainers(), getSignalements(), getZones(), getAgents(), getCapteurs(), getDashboardStats(), getContainersNeedingService(), getTournees(), getContainerStatsDashboard(), getTourStatsDashboard()])
      .then(([cRes, sRes, zRes, aRes, capRes, statsRes, critRes, tourRes, cStatsRes, tStatsRes]) => {
        const rawContainers = cRes.status === 'fulfilled' ? cRes.value : [];
        const capteurs      = capRes.status === 'fulfilled' ? capRes.value : [];
        setState({
          containers:         enrichContainersWithSensors(rawContainers, capteurs),
          signalements:       sRes.status === 'fulfilled' ? sRes.value : [],
          zones:              zRes.status === 'fulfilled' ? zRes.value : [],
          agents:             aRes.status === 'fulfilled' ? aRes.value : [],
          tournees:           tourRes.status === 'fulfilled' ? tourRes.value : [],
          criticalContainers: critRes.status === 'fulfilled' ? (critRes.value || []) : [],
          dashboardStats:     {
            ...(statsRes.status === 'fulfilled' ? statsRes.value : {}),
            containerStats: cStatsRes.status === 'fulfilled' ? cStatsRes.value : null,
            tourStats:      tStatsRes.status === 'fulfilled' ? tStatsRes.value : null,
          },
          loading: false,
          error: null,
        });
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const iv = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [load]);

  return state;
}
