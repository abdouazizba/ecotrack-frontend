import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCapteurs, createCapteur, updateCapteur, deleteCapteur,
  assignCapteurToConteneur, getContainers,
} from '../../../services/api';
import CapteursList from './components/CapteursList';
import CapteurDetail from './components/CapteurDetail';
import CapteurFormModal from './components/CapteurFormModal';
import AssignConteneurModal from './components/AssignConteneurModal';
import './CapteurPage.css';

export default function CapteurPage() {
  const [capteurs, setCapteurs]         = useState([]);
  const [conteneurs, setConteneurs]     = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [filter, setFilter]             = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [showForm, setShowForm]         = useState(false);
  const [editCapteur, setEditCapteur]   = useState(null);
  const [showAssign, setShowAssign]     = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [caps, conts] = await Promise.all([getCapteurs(), getContainers()]);
      setCapteurs(caps);
      setConteneurs(conts);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des capteurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => filter === 'all' ? capteurs : capteurs.filter((c) => c.statut === filter),
    [capteurs, filter]
  );

  const selectedCapteur = capteurs.find((c) => c.id === selectedId) || null;

  // ── Create / Edit ──────────────────────────────────
  const handleOpenCreate = () => { setEditCapteur(null); setShowForm(true); };
  const handleOpenEdit   = (cap) => { setEditCapteur(cap); setShowForm(true); };

  const handleFormSubmit = useCallback(async (data) => {
    try {
      if (editCapteur) {
        await updateCapteur(editCapteur.id, data);
      } else {
        await createCapteur(data);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(editCapteur ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    }
  }, [editCapteur, load]);

  // ── Delete ─────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteCapteur(id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError('Erreur lors de la suppression');
    }
  }, [load, selectedId]);

  // ── Statut change (via PUT) ────────────────────────
  const handleStatutChange = useCallback(async (id, newStatut) => {
    try {
      await updateCapteur(id, { statut: newStatut });
      await load();
    } catch {
      setError('Erreur lors du changement de statut');
    }
  }, [load]);

  // ── Assign ────────────────────────────────────────
  const handleOpenAssign = (cap) => { setAssignTarget(cap); setShowAssign(true); };

  const handleAssignSubmit = useCallback(async (capteurId, conteneurId) => {
    try {
      await assignCapteurToConteneur(capteurId, conteneurId);
      setShowAssign(false);
      await load();
    } catch {
      setError('Erreur lors de l\'assignation');
    }
  }, [load]);

  return (
    <div className="cap-page">
      {error && (
        <div className="cap-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="cap-split">
        <CapteursList
          capteurs={filtered}
          selectedId={selectedId}
          filter={filter}
          loading={loading}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
          onCreate={handleOpenCreate}
        />

        <div className="cap-right">
          <CapteurDetail
            capteur={selectedCapteur}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onAssign={handleOpenAssign}
            onStatutChange={handleStatutChange}
          />
        </div>
      </div>

      <CapteurFormModal
        show={showForm}
        capteur={editCapteur}
        conteneurs={conteneurs}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
      />

      <AssignConteneurModal
        show={showAssign}
        capteur={assignTarget}
        conteneurs={conteneurs}
        onClose={() => setShowAssign(false)}
        onSubmit={handleAssignSubmit}
      />
    </div>
  );
}
