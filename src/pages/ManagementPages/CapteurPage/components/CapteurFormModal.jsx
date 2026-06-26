import React, { useState, useEffect } from 'react';
import { X, Cpu, Battery, Thermometer, Wifi, Gauge, AlertCircle } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';
import SearchableSelect from '../../../../components/common/SearchableSelect';

const MAX_CAPTEURS = 5;

const genCode = () => {
  const d = new Date();
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `CAPT-${ts}-${rand}`;
};

const TYPE_ICONS = {
  REMPLISSAGE: { Icon: Gauge, color: '#3b82f6', label: 'Remplissage' },
  TEMPERATURE: { Icon: Thermometer, color: '#f97316', label: 'Température' },
  SIGNAL:      { Icon: Wifi, color: '#8b5cf6', label: 'Signal' },
};

const EMPTY = {
  code_capteur: '',
  type: 'REMPLISSAGE',
  id_conteneur: '',
  statut: 'ACTIF',
  batterie: '',
};

export default function CapteurFormModal({ show, capteur, conteneurs: conteneursProp, capteurs: allCapteurs, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [conteneurs, setConteneurs] = useState(conteneursProp || []);

  useEffect(() => {
    if (conteneursProp?.length) setConteneurs(conteneursProp);
  }, [conteneursProp]);

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
      setForm({ ...EMPTY, code_capteur: genCode() });
    }
  }, [capteur, show]);

  if (!show) return null;

  const isEdit = Boolean(capteur);

  const containerCapteurs = (Array.isArray(allCapteurs) ? allCapteurs : [])
    .filter((c) => c.id_conteneur === form.id_conteneur);
  const isFull = !isEdit && containerCapteurs.length >= MAX_CAPTEURS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFull) return;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        batterie: form.batterie !== '' ? Math.min(100, Math.max(0, Number(form.batterie))) : undefined,
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
      <div className="cap-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
        <div className="cap-modal-header">
          <h3>{isEdit ? 'Modifier le capteur' : 'Nouveau capteur'}</h3>
          <button className="cap-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="cap-modal-form" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
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
            <SearchableSelect
              value={form.id_conteneur}
              options={conteneurs.map((c) => ({ value: c.id, label: `${c.code_conteneur || c.name} (${c.type || '—'})` }))}
              onChange={(val) => setForm({ ...form, id_conteneur: val })}
              placeholder="— Choisir un conteneur —"
            />
          </div>

          {/* Widget capteurs existants */}
          {form.id_conteneur && (
            <div style={{
              background: isFull ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.06)',
              border: `1px solid ${isFull ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.15)'}`,
              borderRadius: 10, padding: '10px 12px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: containerCapteurs.length ? 8 : 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isFull ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Cpu size={12} />
                  Capteurs : {containerCapteurs.length}/{MAX_CAPTEURS}
                </span>
                {isFull && (
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <AlertCircle size={11} /> Maximum atteint
                  </span>
                )}
              </div>
              {containerCapteurs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {containerCapteurs.map((c) => {
                    const tm = TYPE_ICONS[c.type] || TYPE_ICONS.REMPLISSAGE;
                    return (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                        background: 'rgba(255,255,255,0.08)', borderRadius: 6, fontSize: '0.75rem',
                      }}>
                        <tm.Icon size={12} color={tm.color} />
                        <span style={{ color: '#e2e8f0', fontWeight: 600, flex: 1 }}>{c.code_capteur}</span>
                        <span style={{ color: '#94a3b8' }}>{tm.label}</span>
                        {c.batterie != null && (
                          <span style={{ color: c.batterie < 20 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Battery size={10} /> {c.batterie}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {containerCapteurs.length === 0 && (
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>Aucun capteur sur ce conteneur</span>
              )}
            </div>
          )}

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
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) {
                  setForm({ ...form, batterie: v });
                }
              }}
            />
          </div>

          <div className="cap-modal-footer">
            <button type="button" className="cap-btn-cancel" onClick={handleClose}>
              Annuler
            </button>
            <button type="submit" className="cap-btn-confirm" disabled={loading || isFull}>
              {loading ? 'Enregistrement…' : isFull ? 'Max 5 capteurs' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
