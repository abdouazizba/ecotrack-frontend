import { useState, useEffect } from 'react';
import { getContainers, getSignalements, getZones, getAgents, getCapteurs } from '../services/api';
import { enrichContainersWithSensors } from '../services/transformers';

export default function useDashboardData() {
  const [state, setState] = useState({
    containers: [],
    signalements: [],
    zones: [],
    agents: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.allSettled([getContainers(), getSignalements(), getZones(), getAgents(), getCapteurs()])
      .then(([cRes, sRes, zRes, aRes, capRes]) => {
        const rawContainers = cRes.status === 'fulfilled' ? cRes.value : [];
        const capteurs      = capRes.status === 'fulfilled' ? capRes.value : [];
        setState({
          containers:   enrichContainersWithSensors(rawContainers, capteurs),
          signalements: sRes.status === 'fulfilled' ? sRes.value : [],
          zones:        zRes.status === 'fulfilled' ? zRes.value : [],
          agents:       aRes.status === 'fulfilled' ? aRes.value : [],
          loading: false,
          error: null,
        });
      });
  }, []);

  return state;
}
