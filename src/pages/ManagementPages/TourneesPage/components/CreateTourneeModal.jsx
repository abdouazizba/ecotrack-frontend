import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';

const EMPTY_FORM = { titre: '', zone_id: '', zone_nom: '', date_prevue: '', agent_id: '' };

export default function CreateTourneeModal({ show, zones, agents, tournees = [], initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = !!initialData;

  useEffect(() => {
    if (show) {
      setForm(
        initialData
          ? {
              titre:      initialData.titre      || '',
              zone_id:    initialData.zone_id     || '',
              zone_nom:   initialData.zone_nom    || '',
              date_prevue: initialData.date_prevue || '',
              agent_id:   initialData.agent_id    || '',
            }
          : EMPTY_FORM
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const zone  = zones.find((z) => String(z.id) === String(form.zone_id));
    const agent = agents.find((a) => String(a.id) === String(form.agent_id));
    onSubmit({
      ...form,
      zone_nom:  zone?.nom || form.zone_id,
      agent_nom: agent ? `${agent.firstName} ${agent.lastName}` : null,
    });
    setForm(EMPTY_FORM);
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

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
            <div className="t-field">
              <label>Titre</label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Ex : Tournée Zone Nord — Matin"
              />
            </div>
            <div className="t-field">
              <label>Zone *</label>
              <select
                required
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
              >
                <option value="">— Choisir une zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.nom}</option>
                ))}
              </select>
            </div>
            <div className="t-field">
              <label>Date prévue *</label>
              <input
                type="date"
                required
                value={form.date_prevue}
                onChange={(e) => setForm({ ...form, date_prevue: e.target.value })}
              />
            </div>
            <div className="t-field">
              <label>Agent responsable</label>
              <select
                value={form.agent_id}
                onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
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
