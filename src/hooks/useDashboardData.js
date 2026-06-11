import { useState, useEffect } from 'react';
import { getContainers, getSignalements, getZones, getAgents, getCapteurs, getDashboardStats } from '../services/api';
import { enrichContainersWithSensors } from '../services/transformers';

export default function useDashboardData() {
  const [state, setState] = useState({
    containers: [],
    signalements: [],
    zones: [],
    agents: [],
    dashboardStats: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.allSettled([getContainers(), getSignalements(), getZones(), getAgents(), getCapteurs(), getDashboardStats()])
      .then(([cRes, sRes, zRes, aRes, capRes, statsRes]) => {
        const rawContainers = cRes.status === 'fulfilled' ? cRes.value : [];
        const capteurs      = capRes.status === 'fulfilled' ? capRes.value : [];
        setState({
          containers:     enrichContainersWithSensors(rawContainers, capteurs),
          signalements:   sRes.status === 'fulfilled' ? sRes.value : [],
          zones:          zRes.status === 'fulfilled' ? zRes.value : [],
          agents:         aRes.status === 'fulfilled' ? aRes.value : [],
          dashboardStats: statsRes.status === 'fulfilled' ? statsRes.value : {},
          loading: false,
          error: null,
        });
      });
  }, []);

  return state;
}
