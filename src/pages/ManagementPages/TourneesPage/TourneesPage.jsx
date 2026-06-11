import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getTournees, createTournee, updateTournee, deleteTournee,
  updateTourneeStatus, addSignalementToTournee, removeSignalementFromTournee,
  getSignalements, getAgents, getZones,
} from '../../../services/api';
import {
  TourneesList,
  TourneeDetail,
  CreateTourneeModal,
  AddSignalementsModal,
  AssignAgentModal,
} from './components';
import './TourneesPage.css';

export default function TourneesPage() {
  const [tournees, setTournees]               = useState([]);
  const [selectedId, setSelectedId]           = useState(null);
  const [filter, setFilter]                   = useState('all');

  const [agents, setAgents]                   = useState([]);
  const [zones, setZones]                     = useState([]);
  const [allSignalements, setAllSignalements] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);

  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState(null);
  const [showAddSig, setShowAddSig]           = useState(false);
  const [assignTarget, setAssignTarget]       = useState(null);

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
    ]).then(([, sRes, aRes, zRes]) => {
      if (sRes.status === 'fulfilled')
        setAllSignalements((sRes.value || []).filter((s) => s.status === 'pending'));
      if (aRes.status === 'fulfilled') setAgents(aRes.value || []);
      if (zRes.status === 'fulfilled') setZones(zRes.value  || []);
      setLoading(false);
    });
  }, [loadTournees]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedTournee = useMemo(
    () => tournees.find((t) => t.id === selectedId) || null,
    [tournees, selectedId]
  );

  const filtered = useMemo(
    () => filter === 'all' ? tournees : tournees.filter((t) => t.status === filter),
    [tournees, filter]
  );

  const usedSigIds = useMemo(
    () => new Set(tournees.flatMap((t) => (t.signalements || []).map((s) => s.id))),
    [tournees]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateTournee = useCallback(async (formData) => {
    try {
      const agent = agents.find((a) => String(a.id) === String(formData.agent_id));
      const zone  = zones.find((z) => String(z.id) === String(formData.zone_id));
      await createTournee({
        titre:      formData.titre || `Tournée ${zone?.nom || ''} — ${formData.date_prevue}`,
        zone_id:    formData.zone_id,
        agent_id:   agent?.id || null,
        date_prevue: formData.date_prevue,
        status:     'pending',
      });
      await loadTournees();
      setShowCreate(false);
    } catch {
      setError('Erreur lors de la création de la tournée');
    }
  }, [agents, zones, loadTournees]);

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
  }, [editTarget, agents, zones, loadTournees]);

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

  const handleTourneeAgentChange = useCallback(async (agentId) => {
    if (!selectedId) return;
    try {
      const agent = agents.find((a) => a.id === agentId);
      await updateTournee(selectedId, {
        ...selectedTournee,
        agent_id: agent?.id || null,
      });
      await loadTournees();
    } catch {
      setError("Erreur lors de l'assignation de l'agent");
    }
  }, [selectedId, selectedTournee, agents, loadTournees]);

  const handleAddSignalements = useCallback(async (pickedIds) => {
    if (!selectedId) return;
    try {
      await addSignalementToTournee(selectedId, pickedIds);
      await loadTournees();
    } catch {
      // fallback local si le endpoint n'existe pas encore
      const toAdd = allSignalements
        .filter((s) => pickedIds.includes(s.id))
        .map((s) => ({ ...s, assigned_agent_id: null, assigned_agent_nom: null }));
      setTournees((prev) =>
        prev.map((t) =>
          t.id === selectedId
            ? { ...t, signalements: [...(t.signalements || []), ...toAdd] }
            : t
        )
      );
    }
    setShowAddSig(false);
  }, [selectedId, allSignalements, loadTournees]);

  const handleRemoveSignalement = useCallback(async (sigId) => {
    try {
      await removeSignalementFromTournee(selectedId, sigId);
    } catch {
      // endpoint optionnel — on continue dans tous les cas
    }
    setTournees((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? { ...t, signalements: (t.signalements || []).filter((s) => s.id !== sigId) }
          : t
      )
    );
  }, [selectedId]);

  const handleAssignAgent = useCallback((sigId, agent) => {
    setTournees((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              signalements: (t.signalements || []).map((s) =>
                s.id === sigId
                  ? {
                      ...s,
                      assigned_agent_id:  agent?.id || null,
                      assigned_agent_nom: agent
                        ? `${agent.firstName} ${agent.lastName}`
                        : null,
                    }
                  : s
              ),
            }
          : t
      )
    );
  }, [selectedId]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="tournees-page">
      {error && (
        <div className="tournees-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

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
            agents={agents}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTournee}
            onAgentChange={handleTourneeAgentChange}
            onAddSigClick={() => setShowAddSig(true)}
            onAssignClick={(sig) => setAssignTarget(sig)}
            onRemoveSignalement={handleRemoveSignalement}
            onEditClick={(t) => setEditTarget(t)}
          />
        </div>
      </div>

      <CreateTourneeModal
        show={showCreate}
        zones={zones}
        agents={agents}
        tournees={tournees}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateTournee}
      />

      <CreateTourneeModal
        show={!!editTarget}
        zones={zones}
        agents={agents}
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

      <AssignAgentModal
        show={!!assignTarget}
        signalement={assignTarget}
        agents={agents}
        onClose={() => setAssignTarget(null)}
        onSubmit={handleAssignAgent}
      />
    </div>
  );
}
