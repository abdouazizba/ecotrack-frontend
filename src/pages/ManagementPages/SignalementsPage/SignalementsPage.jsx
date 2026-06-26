import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AlertTriangle, Download, Zap } from 'lucide-react';
import {
  getSignalements, patchSignalement, deleteSignalement,
  getAgents, getContainers, getZones, getTournees, autoAssignSignalements,
  addSignalementToTournee,
} from '../../../services/api';
import { exportToCsv } from '../../../utils/exportCsv';
import PageShell from '../../../components/common/PageShell';
import SignalementsList from './components/SignalementsList';
import SignalementDetail from './components/SignalementDetail';
import './SignalementsPage.css';

const REFRESH_INTERVAL = 30;

const STATUS_FILTERS = [
  ['all', 'Tous'],
  ['pending', 'En attente'],
  ['in_progress', 'En cours'],
  ['closed', 'Cloture'],
  ['rejected', 'Rejete'],
];

export default function SignalementsPage() {
  const [signalements, setSignalements]   = useState([]);
  const [agents, setAgents]               = useState([]);
  const [containers, setContainers]       = useState([]);
  const [zones, setZones]                 = useState([]);
  const [tournees, setTournees]           = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [filter, setFilter]               = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [tab, setTab]                     = useState('monitoring');
  const [countdown, setCountdown]         = useState(REFRESH_INTERVAL);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, agentsData, containersData, zonesData, tourneesData] = await Promise.all([
        getSignalements(), getAgents(), getContainers(), getZones(), getTournees(),
      ]);
      setSignalements(data);
      setAgents(agentsData || []);
      setContainers(containersData || []);
      setZones(zonesData || []);
      setTournees(tourneesData || []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh in monitoring mode
  useEffect(() => {
    if (tab !== 'monitoring') {
      clearInterval(intervalRef.current);
      return;
    }
    setCountdown(REFRESH_INTERVAL);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          load();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [tab, load]);

  const handleManualRefresh = useCallback(() => {
    load();
    setCountdown(REFRESH_INTERVAL);
  }, [load]);

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

  const stats = useMemo(() => [
    { label: 'Ouverts',  value: signalements.filter((s) => s.status === 'pending').length,     color: '#f59e0b' },
    { label: 'En cours', value: signalements.filter((s) => s.status === 'in_progress').length, color: '#3b82f6' },
    { label: 'Fermes',   value: signalements.filter((s) => s.status === 'closed').length,      color: '#10b981' },
    { label: 'Rejetes',  value: signalements.filter((s) => s.status === 'rejected').length,    color: '#ef4444' },
  ], [signalements]);

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

  const handleAddToTournee = useCallback(async (sigId, tourneeId) => {
    try {
      await addSignalementToTournee(tourneeId, [sigId]);
      await load();
    } catch {
      setError("Erreur lors de l'ajout à la tournée");
    }
  }, [load]);

  const [assigning, setAssigning] = useState(false);

  const handleAutoAssign = useCallback(async () => {
    setAssigning(true);
    setError(null);
    try {
      const allTournees = await getTournees();
      // Keep only active tournées (pending / in_progress) that have a zone with coordinates
      const activeTournees = allTournees
        .filter((t) => t.status === 'pending' || t.status === 'in_progress')
        .filter((t) => {
          // Zone coordinates are available from the zones already loaded
          const zone = zones.find((z) => z.id === t.zone_id);
          return zone && zone.latitude && zone.longitude;
        })
        .map((t) => {
          const zone = zones.find((z) => z.id === t.zone_id);
          return { id: t.id, latitude: zone.latitude, longitude: zone.longitude };
        });

      if (activeTournees.length === 0) {
        setError('Aucune tournée active avec coordonnées disponible pour l\'auto-assignation');
        return;
      }

      const result = await autoAssignSignalements(activeTournees);
      const count = result?.data?.assigned || 0;
      if (count > 0) {
        await load();
      }
      setError(count > 0
        ? null
        : 'Aucun signalement ouvert non-assigné avec coordonnées trouvé');
      if (count > 0) {
        // Briefly show success via the error banner (reuse existing UI)
        setError(`${count} signalement(s) auto-assigné(s) avec succès`);
        setTimeout(() => setError(null), 4000);
      }
    } catch {
      setError('Erreur lors de l\'auto-assignation des signalements');
    } finally {
      setAssigning(false);
    }
  }, [zones, load]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      { key: 'id',          label: 'ID' },
      { key: 'type',        label: 'Type' },
      { key: 'priority',    label: 'Priorité' },
      { key: 'status',      label: 'Statut' },
      { key: 'description', label: 'Description' },
      { key: 'created_at',  label: 'Date création' },
      { key: 'adresse',     label: 'Adresse' },
    ];
    const rows = filtered.map((s) => ({
      id:          s.id ? s.id.slice(0, 8) : '',
      type:        s.type || '',
      priority:    s.priority || '',
      status:      s.status || '',
      description: s.description || '',
      created_at:  s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '',
      adresse:     s.adresse || s.address || '',
    }));
    const today = new Date().toISOString().slice(0, 10);
    exportToCsv(`signalements_${today}.csv`, headers, rows);
  }, [filtered]);

  const filtersNode = (
    <>
      {STATUS_FILTERS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          style={{
            padding: '6px 12px', borderRadius: 7, border: '1px solid',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
            background: filter === key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
            borderColor: filter === key ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
            color: filter === key ? '#3b82f6' : '#94a3b8',
          }}
        >
          {label}
        </button>
      ))}
      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 8px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <option value="all">Toutes priorites</option>
        <option value="critical">Critique</option>
        <option value="high">Haute</option>
        <option value="medium">Normale</option>
        <option value="low">Basse</option>
      </select>
    </>
  );

  return (
    <PageShell
      icon={AlertTriangle}
      title="Signalements"
      count={signalements.length}
      hasTabs
      activeTab={tab}
      onTabChange={setTab}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Rechercher par description, type, ID..."
      filters={filtersNode}
      refreshCountdown={countdown}
      onRefresh={handleManualRefresh}
    >
      <div className="sig-page">
        {error && (
          <div className="sig-error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 12px 8px' }}>
          <button
            onClick={handleAutoAssign}
            disabled={assigning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: assigning ? 'wait' : 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
          >
            <Zap size={14} /> {assigning ? 'Assignation...' : 'Auto-assigner'}
          </button>
          <button
            onClick={handleExportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}
          >
            <Download size={14} /> Exporter CSV
          </button>
        </div>

        <div className="sig-split">
          <SignalementsList
            signalements={filtered}
            allSignalements={signalements}
            selectedId={selectedId}
            filter={filter}
            loading={loading}
            zones={zones}
            containers={containers}
            onSelect={setSelectedId}
            hideFilters
          />

          <div className="sig-right">
            <SignalementDetail
              signalement={selectedSignalement}
              agents={agents}
              tournees={tournees}
              onStatusChange={handleStatusChange}
              onAgentAssign={handleAgentAssign}
              onAddToTournee={handleAddToTournee}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
