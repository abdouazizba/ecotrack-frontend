import React, { useState } from 'react';
import { X } from 'lucide-react';

const EMPTY_FORM = { titre: '', zone_id: '', zone_nom: '', date_prevue: '', agent_id: '' };

export default function CreateTourneeModal({ show, zones, agents, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const zone = zones.find((z) => z.id === form.zone_id);
    const agent = agents.find((a) => a.id === form.agent_id);
    onSubmit({
      ...form,
      zone_nom: zone?.nom || form.zone_id,
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
      <div className="t-modal" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3>Nouvelle tournée</h3>
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
          </div>
          <div className="t-modal-footer">
            <button type="button" className="t-btn-cancel" onClick={handleClose}>Annuler</button>
            <button type="submit" className="t-btn-confirm">Créer la tournée</button>
          </div>
        </form>
      </div>
    </div>
  );
}
