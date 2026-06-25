import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, MapPin, UserCheck, Users, Clock, Truck } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';
import ZoneMapPicker from './ZoneMapPicker';

const genTag = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
};

const EMPTY_FORM = {
  titre: '', selected_zone_ids: [], date_prevue: '', heure_debut: '',
  agent_id: '', support_agent_ids: [], vehicule_id: '',
};

const TYPE_VEHICULE_LABELS = {
  BENNE: 'Benne', COMPACTEUR: 'Compacteur', UTILITAIRE: 'Utilitaire', CAMION_GRUE: 'Camion grue',
};

export default function CreateTourneeModal({
  show, zones, agents, vehicules = [], tournees = [], zoneSigCounts = {}, initialData, onClose, onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = !!initialData;

  useEffect(() => {
    if (show) {
      setForm(
        initialData
          ? {
              titre:             initialData.titre      || '',
              selected_zone_ids: initialData.zone_id ? [initialData.zone_id] : [],
              date_prevue:       initialData.date_prevue || '',
              heure_debut:       initialData.heure_debut || '',
              agent_id:          initialData.agent_id    || '',
              vehicule_id:       initialData.vehicule_id || '',
              support_agent_ids: (initialData.agents || [])
                .filter((a) => a.role !== 'CONDUCTEUR')
                .map((a) => a.id),
            }
          : { ...EMPTY_FORM, titre: `TRN-${genTag()}` }
      );
    }
  }, [show, initialData]);

  if (!show) return null;

  const conflict = form.agent_id && form.date_prevue
    ? tournees.find(
        (t) =>
          String(t.agent_id) === String(form.agent_id) &&
          t.date_prevue === form.date_prevue &&
          (t.status === 'pending' || t.status === 'in_progress') &&
          (!initialData || t.id !== initialData.id)
      )
    : null;

  const conflictAgent = conflict
    ? agents.find((a) => String(a.id) === String(form.agent_id))
    : null;

  const toggleZone = (zoneId) =>
    setForm((prev) => ({
      ...prev,
      selected_zone_ids: prev.selected_zone_ids.includes(zoneId)
        ? prev.selected_zone_ids.filter((id) => id !== zoneId)
        : [...prev.selected_zone_ids, zoneId],
    }));

  const toggleSupportAgent = (agentId) =>
    setForm((prev) => ({
      ...prev,
      support_agent_ids: prev.support_agent_ids.includes(agentId)
        ? prev.support_agent_ids.filter((id) => id !== agentId)
        : [...prev.support_agent_ids, agentId],
    }));

  const totalSigs = form.selected_zone_ids.reduce(
    (sum, zid) => sum + (zoneSigCounts[zid] || 0), 0
  );

  // agents disponibles comme soutien = tous sauf le responsable
  const supportCandidates = agents.filter(
    (a) => !form.agent_id || String(a.id) !== String(form.agent_id)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const agent = agents.find((a) => String(a.id) === String(form.agent_id));
    onSubmit({
      ...form,
      agent_nom: agent ? `${agent.firstName} ${agent.lastName}` : null,
    });
    setForm(EMPTY_FORM);
  };

  const handleClose = () => { setForm(EMPTY_FORM); onClose(); };

  return (
    <div className="t-overlay" onClick={handleClose}>
      <div className="t-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
          <div className="t-modal-header">
            <h3>{isEdit ? 'Modifier la tournée' : 'Nouvelle tournée'}</h3>
            <button className="t-modal-close" onClick={handleClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="t-modal-form">

            {/* Zones — sélection sur carte */}
            <div className="t-field">
              <label>
                <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Zones à couvrir
                {form.selected_zone_ids.length > 0 && (
                  <span className="t-zone-sig-total">
                    {form.selected_zone_ids.length} zone{form.selected_zone_ids.length > 1 ? 's' : ''}
                    {totalSigs > 0 && ` · ${totalSigs} sig.`}
                  </span>
                )}
              </label>
              {zones.length === 0 ? (
                <p className="t-no-zones">Aucune zone disponible</p>
              ) : (
                <ZoneMapPicker
                  zones={zones}
                  selectedIds={form.selected_zone_ids}
                  sigCounts={zoneSigCounts}
                  onToggle={toggleZone}
                />
              )}
            </div>

            {/* Date + Heure */}
            <div className="t-field" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 2 }}>
                <label>Date prévue *</label>
                <input
                  type="date"
                  required
                  value={form.date_prevue}
                  onChange={(e) => setForm({ ...form, date_prevue: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Heure début
                </label>
                <input
                  type="time"
                  value={form.heure_debut}
                  onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                  placeholder="07:00"
                />
              </div>
            </div>

            {/* Agent responsable */}
            <div className="t-field">
              <label>
                <UserCheck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Agent responsable
              </label>
              <select
                value={form.agent_id}
                onChange={(e) => {
                  const newId = e.target.value;
                  // retirer du soutien si sélectionné comme responsable
                  setForm((prev) => ({
                    ...prev,
                    agent_id: newId,
                    support_agent_ids: prev.support_agent_ids.filter((id) => id !== newId),
                  }));
                }}
              >
                <option value="">— Non assigné —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                ))}
              </select>
              {conflict && conflictAgent && (
                <div className="t-conflict-warning">
                  <AlertTriangle size={13} />
                  <span>
                    {conflictAgent.firstName} {conflictAgent.lastName} a déjà une tournée
                    « {conflict.titre} » prévue ce jour-là.
                  </span>
                </div>
              )}
            </div>

            {/* Agents en soutien */}
            {supportCandidates.length > 0 && (
              <div className="t-field">
                <label>
                  <Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Agents en soutien
                  {form.support_agent_ids.length > 0 && (
                    <span className="t-zone-sig-total">
                      {form.support_agent_ids.length} sélectionné{form.support_agent_ids.length > 1 ? 's' : ''}
                    </span>
                  )}
                </label>
                <div className="t-zone-list">
                  {supportCandidates.map((a) => {
                    const checked = form.support_agent_ids.includes(a.id);
                    return (
                      <label key={a.id} className={`t-zone-item${checked ? ' t-zone-item--checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSupportAgent(a.id)}
                        />
                        <span className="t-zone-name">{a.firstName} {a.lastName}</span>
                        <span className="t-zone-empty" style={{ fontSize: 10 }}>soutien</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Véhicule */}
            {vehicules.length > 0 && (
              <div className="t-field">
                <label>
                  <Truck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Véhicule
                </label>
                <select
                  value={form.vehicule_id}
                  onChange={(e) => setForm({ ...form, vehicule_id: e.target.value })}
                >
                  <option value="">— Non assigné —</option>
                  {vehicules
                    .filter((v) => v.statut === 'ACTIF' || v.id === form.vehicule_id)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} — {[v.marque, v.modele].filter(Boolean).join(' ')}
                        {v.type_vehicule ? ` (${TYPE_VEHICULE_LABELS[v.type_vehicule] || v.type_vehicule})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="t-modal-footer">
              <button type="button" className="t-btn-cancel" onClick={handleClose}>Annuler</button>
              <button type="submit" className="t-btn-confirm">
                {isEdit ? 'Enregistrer' : 'Créer la tournée'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
