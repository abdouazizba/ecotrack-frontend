import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMPTY = {
  code_capteur: '',
  type: 'REMPLISSAGE',
  id_conteneur: '',
  statut: 'ACTIF',
  batterie: '',
};

export default function CapteurFormModal({ show, capteur, conteneurs, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (capteur) {
      setForm({
        code_capteur: capteur.code_capteur || '',
        type:         capteur.type         || 'REMPLISSAGE',
        id_conteneur: capteur.id_conteneur || '',
        statut:       capteur.statut       || 'ACTIF',
        batterie:     capteur.batterie !== null && capteur.batterie !== undefined
                        ? String(capteur.batterie)
                        : '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [capteur, show]);

  if (!show) return null;

  const isEdit = Boolean(capteur);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        batterie: form.batterie !== '' ? Number(form.batterie) : undefined,
      });
      setForm(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY);
    onClose();
  };

  return (
    <div className="cap-overlay" onClick={handleClose}>
      <div className="cap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cap-modal-header">
          <h3>{isEdit ? 'Modifier le capteur' : 'Nouveau capteur'}</h3>
          <button className="cap-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="cap-modal-form">
          <div className="cap-field">
            <label>Code capteur *</label>
            <input
              type="text"
              required
              placeholder="Ex : CAPT-PC-001-REMPLISSAGE"
              value={form.code_capteur}
              onChange={(e) => setForm({ ...form, code_capteur: e.target.value })}
            />
          </div>

          <div className="cap-field">
            <label>Type *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="REMPLISSAGE">Remplissage</option>
              <option value="TEMPERATURE">Température</option>
              <option value="SIGNAL">Signal</option>
            </select>
          </div>

          <div className="cap-field">
            <label>Conteneur *</label>
            <select
              required
              value={form.id_conteneur}
              onChange={(e) => setForm({ ...form, id_conteneur: e.target.value })}
            >
              <option value="">— Choisir un conteneur —</option>
              {conteneurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code_conteneur || c.name} ({c.type || '—'})
                </option>
              ))}
            </select>
          </div>

          <div className="cap-field">
            <label>Statut</label>
            <select
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="EN_MAINTENANCE">En maintenance</option>
            </select>
          </div>

          <div className="cap-field">
            <label>Batterie (%) — optionnel</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Ex : 85"
              value={form.batterie}
              onChange={(e) => setForm({ ...form, batterie: e.target.value })}
            />
          </div>

          <div className="cap-modal-footer">
            <button type="button" className="cap-btn-cancel" onClick={handleClose}>
              Annuler
            </button>
            <button type="submit" className="cap-btn-confirm" disabled={loading}>
              {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
