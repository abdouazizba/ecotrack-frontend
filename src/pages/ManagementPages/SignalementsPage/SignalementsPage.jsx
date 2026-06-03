import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSignalements, patchSignalement, deleteSignalement, getAgents } from '../../../services/api';
import SignalementsList from './components/SignalementsList';
import SignalementDetail from './components/SignalementDetail';
import './SignalementsPage.css';

export default function SignalementsPage() {
  const [signalements, setSignalements]   = useState([]);
  const [agents, setAgents]               = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getSignalements(), getAgents()]);
      setSignalements(data);
      setAgents(agentsData || []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => filter === 'all' ? signalements : signalements.filter((s) => s.status === filter),
    [signalements, filter]
  );

  const selectedSignalement = signalements.find((s) => s.id === selectedId) || null;

  const handleStatusChange = useCallback(async (id, newStatus, motifRejet, photoResolutionUrl) => {
    try {
      await patchSignalement(id, {
        status: newStatus,
        motif_rejet: motifRejet,
        photo_resolution_url: photoResolutionUrl,
      });
      await load();
    } catch {
      setError('Erreur lors de la mise à jour du statut');
    }
  }, [load]);

  const handleAgentAssign = useCallback(async (id, agentId) => {
    try {
      await patchSignalement(id, { agent_id: agentId });
      await load();
    } catch {
      setError("Erreur lors de l'assignation de l'agent");
    }
  }, [load]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteSignalement(id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError('Erreur lors de la suppression');
    }
  }, [load, selectedId]);

  return (
    <div className="sig-page">
      {error && (
        <div className="sig-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="sig-split">
        <SignalementsList
          signalements={filtered}
          selectedId={selectedId}
          filter={filter}
          loading={loading}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
        />

        <div className="sig-right">
          <SignalementDetail
            signalement={selectedSignalement}
            agents={agents}
            onStatusChange={handleStatusChange}
            onAgentAssign={handleAgentAssign}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
