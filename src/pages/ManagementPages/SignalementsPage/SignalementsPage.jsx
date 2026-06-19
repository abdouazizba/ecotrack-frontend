import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSignalements, patchSignalement, deleteSignalement,
  getAgents, getContainers, getZones,
} from '../../../services/api';
import SignalementsList from './components/SignalementsList';
import SignalementDetail from './components/SignalementDetail';
import './SignalementsPage.css';

export default function SignalementsPage() {
  const [signalements, setSignalements]   = useState([]);
  const [agents, setAgents]               = useState([]);
  const [containers, setContainers]       = useState([]);
  const [zones, setZones]                 = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [filter, setFilter]               = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, agentsData, containersData, zonesData] = await Promise.all([
        getSignalements(), getAgents(), getContainers(), getZones(),
      ]);
      setSignalements(data);
      setAgents(agentsData || []);
      setContainers(containersData || []);
      setZones(zonesData || []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = signalements;
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    if (priorityFilter !== 'all') list = list.filter((s) => s.priority === priorityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        (s.description || '').toLowerCase().includes(q) ||
        (s.type || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [signalements, filter, priorityFilter, search]);

  const selectedSignalement = signalements.find((s) => s.id === selectedId) || null;

  const handleStatusChange = useCallback(async (id, newStatus, motifRejet, photoFile, notes) => {
    try {
      await patchSignalement(id, {
        status: newStatus,
        motif_rejet: motifRejet,
        photoFile,
        notes,
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
          allSignalements={signalements}
          selectedId={selectedId}
          filter={filter}
          priorityFilter={priorityFilter}
          search={search}
          loading={loading}
          zones={zones}
          containers={containers}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
          onPriorityChange={setPriorityFilter}
          onSearchChange={setSearch}
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
