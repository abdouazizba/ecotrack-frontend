import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  getTournees, createTournee, updateTournee, deleteTournee,
  updateTourneeStatus, addSignalementToTournee, removeSignalementFromTournee,
  getSignalementsByTournee, assignAgentToTournee,
  getSignalements, getAgents, getZones, getContainers, getVehicules,
} from '../../../services/api';
import { exportToCsv } from '../../../utils/exportCsv';
import {
  TourneesList,
  TourneeDetail,
  CreateTourneeModal,
  AddSignalementsModal,
} from './components';
import './TourneesPage.css';

export default function TourneesPage() {
  const [tournees, setTournees]               = useState([]);
  const [selectedId, setSelectedId]           = useState(null);
  const [filter, setFilter]                   = useState('all');

  const [agents, setAgents]                   = useState([]);
  const [zones, setZones]                     = useState([]);
  const [allSignalements, setAllSignalements] = useState([]);
  const [containers, setContainers]           = useState([]);
  const [vehicules, setVehicules]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);

  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState(null);
  const [showAddSig, setShowAddSig]           = useState(false);
  const [tourneeSignalements, setTourneeSignalements] = useState([]);
  const [sigsLoading, setSigsLoading]         = useState(false);

  // ── Chargement initial ────────────────────────────────────────────────────
  const loadTournees = useCallback(async () => {
    try {
      const data = await getTournees();
      setTournees(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des tournées');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loadTournees(),
      getSignalements(),
      getAgents(),
      getZones(),
      getContainers(),
      getVehicules(),
    ]).then(([, sRes, aRes, zRes, cRes, vRes]) => {
      if (sRes.status === 'fulfilled')
        setAllSignalements(
          (sRes.value || []).filter((s) => s.status === 'pending' && !s.id_tournee)
        );
      if (aRes.status === 'fulfilled') setAgents(aRes.value || []);
      if (zRes.status === 'fulfilled') setZones(zRes.value  || []);
      if (cRes.status === 'fulfilled') setContainers(cRes.value || []);
      if (vRes.status === 'fulfilled') setVehicules(vRes.value || []);
      setLoading(false);
    });
  }, [loadTournees]);

  // ── Chargement signalements d'une tournée ──────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setTourneeSignalements([]); return; }
    setSigsLoading(true);
    getSignalementsByTournee(selectedId)
      .then((sigs) => setTourneeSignalements(Array.isArray(sigs) ? sigs : []))
      .catch(() => setTourneeSignalements([]))
      .finally(() => setSigsLoading(false));
  }, [selectedId]);

  const reloadTourneeSignalements = useCallback(async () => {
    if (!selectedId) return;
    const sigs = await getSignalementsByTournee(selectedId);
    setTourneeSignalements(Array.isArray(sigs) ? sigs : []);
  }, [selectedId]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedTournee = useMemo(
    () => tournees.find((t) => t.id === selectedId) || null,
    [tournees, selectedId]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return tournees;
    if (filter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      return tournees.filter((t) => (t.date_prevue || '').slice(0, 10) === today);
    }
    return tournees.filter((t) => t.status === filter);
  }, [tournees, filter]);

  // Map conteneurId → zoneId for quick zone lookup
  const conteneurZoneMap = useMemo(() => {
    const map = {};
    containers.forEach((c) => { if (c.id) map[c.id] = c.zoneId || null; });
    return map;
  }, [containers]);

  // Count of unassigned pending signalements per zone + list of their ids
  const { zoneSigCounts, zoneSigIds } = useMemo(() => {
    const counts = {};
    const ids    = {};
    allSignalements.forEach((s) => {
      const zid = s.id_zone || conteneurZoneMap[s.id_conteneur] || null;
      if (!zid) return;
      counts[zid] = (counts[zid] || 0) + 1;
      ids[zid] = ids[zid] ? [...ids[zid], s.id] : [s.id];
    });
    return { zoneSigCounts: counts, zoneSigIds: ids };
  }, [allSignalements, conteneurZoneMap]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateTournee = useCallback(async (formData) => {
    try {
      const created = await createTournee({
        titre:       formData.titre || `Tournée du ${formData.date_prevue}`,
        date_prevue: formData.date_prevue,
        heure_debut: formData.heure_debut || null,
        status:      'pending',
      });
      if (!created?.id) throw new Error('Tournée créée sans ID');

      // Assigner le responsable (CONDUCTEUR) puis les agents en soutien (COLLECTEUR)
      const agentJobs = [];
      if (formData.agent_id) {
        agentJobs.push(assignAgentToTournee(created.id, formData.agent_id, 'CONDUCTEUR'));
      }
      (formData.support_agent_ids || []).forEach((id) => {
        agentJobs.push(assignAgentToTournee(created.id, id, 'COLLECTEUR'));
      });
      if (agentJobs.length) {
        const results = await Promise.allSettled(agentJobs);
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) console.warn(`${failed.length} agent(s) non assigné(s):`, failed.map((r) => r.reason?.message));
      }

      // Auto-assigner les signalements des zones sélectionnées
      const selectedZones = formData.selected_zone_ids || [];
      if (selectedZones.length > 0) {
        const sigIds = selectedZones.flatMap((zid) => zoneSigIds[zid] || []);
        if (sigIds.length > 0) {
          await addSignalementToTournee(created.id, sigIds).catch(() => {});
        }
      }

      await loadTournees();
      setShowCreate(false);
      setSelectedId(created.id);
      setFilter('all');
    } catch (err) {
      setError('Erreur lors de la création de la tournée');
    }
  }, [loadTournees, zoneSigIds]);

  const handleEditTournee = useCallback(async (formData) => {
    if (!editTarget) return;
    try {
      const agent = agents.find((a) => String(a.id) === String(formData.agent_id));
      await updateTournee(editTarget.id, {
        titre:      formData.titre || editTarget.titre,
        zone_id:    formData.zone_id,
        agent_id:   agent?.id || null,
        date_prevue: formData.date_prevue,
        status:     editTarget.status,
      });
      await loadTournees();
      setEditTarget(null);
    } catch {
      setError('Erreur lors de la modification de la tournée');
    }
  }, [editTarget, agents, loadTournees]);

  const handleDeleteTournee = useCallback(async (id) => {
    if (!window.confirm('Supprimer cette tournée ?')) return;
    try {
      await deleteTournee(id);
      if (selectedId === id) setSelectedId(null);
      await loadTournees();
    } catch {
      setError('Erreur lors de la suppression');
    }
  }, [selectedId, loadTournees]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await updateTourneeStatus(id, status);
      await loadTournees();
    } catch {
      // fallback optimiste si le endpoint statut n'existe pas
      setTournees((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    }
  }, [loadTournees]);



  const handleAddSignalements = useCallback(async (pickedIds) => {
    if (!selectedId) return;
    try {
      await addSignalementToTournee(selectedId, pickedIds);
      await reloadTourneeSignalements();
      setAllSignalements((prev) => prev.filter((s) => !pickedIds.includes(s.id)));
    } catch {
      setError("Erreur lors de l'ajout des signalements");
    }
    setShowAddSig(false);
  }, [selectedId, reloadTourneeSignalements]);

  const handleRemoveSignalement = useCallback(async (sigId) => {
    try {
      await removeSignalementFromTournee(selectedId, sigId);
    } catch {
      // on continue même si l'API échoue
    }
    setTourneeSignalements((prev) => prev.filter((s) => s.id !== sigId));
  }, [selectedId]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      { key: 'code',       label: 'Code' },
      { key: 'date',       label: 'Date' },
      { key: 'status',     label: 'Statut' },
      { key: 'distance',   label: 'Distance (km)' },
      { key: 'conteneurs', label: 'Conteneurs collectés' },
      { key: 'notes',      label: 'Notes' },
    ];
    const rows = filtered.map((t) => ({
      code:       t.titre || t.code || t.id || '',
      date:       t.date_prevue ? new Date(t.date_prevue).toLocaleDateString('fr-FR') : '',
      status:     t.status || '',
      distance:   t.distance_km != null ? t.distance_km : (t.distance || ''),
      conteneurs: t.conteneurs_collectes != null ? t.conteneurs_collectes : (t.signalements ? t.signalements.length : ''),
      notes:      t.notes || '',
    }));
    const today = new Date().toISOString().slice(0, 10);
    exportToCsv(`tournees_${today}.csv`, headers, rows);
  }, [filtered]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="tournees-page">
      {error && (
        <div className="tournees-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 8px' }}>
        <button
          onClick={handleExportCsv}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}
        >
          <Download size={14} /> Exporter CSV
        </button>
      </div>

      <div className="tournees-split">
        <TourneesList
          tournees={filtered}
          selectedId={selectedId}
          filter={filter}
          loading={loading}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
          onCreateClick={() => setShowCreate(true)}
        />

        <div className="tournees-right">
          <TourneeDetail
            tournee={selectedTournee}
            sigs={tourneeSignalements}
            sigsLoading={sigsLoading}
            agents={agents}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTournee}
            onAddSigClick={() => setShowAddSig(true)}
            onRemoveSignalement={handleRemoveSignalement}
            onEditClick={(t) => setEditTarget(t)}
          />
        </div>
      </div>

      <CreateTourneeModal
        show={showCreate}
        zones={zones}
        agents={agents}
        vehicules={vehicules}
        tournees={tournees}
        zoneSigCounts={zoneSigCounts}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateTournee}
      />

      <CreateTourneeModal
        show={!!editTarget}
        zones={zones}
        agents={agents}
        vehicules={vehicules}
        tournees={tournees}
        initialData={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditTournee}
      />

      <AddSignalementsModal
        show={showAddSig}
        allSigs={allSignalements}
        tournees={tournees}
        currentTourneeId={selectedId}
        onClose={() => setShowAddSig(false)}
        onSubmit={handleAddSignalements}
      />

    </div>
  );
}
