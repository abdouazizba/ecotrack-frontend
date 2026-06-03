import React, { useState, useEffect } from 'react';
import { X, Link2 } from 'lucide-react';

export default function AssignConteneurModal({ show, capteur, conteneurs, onClose, onSubmit }) {
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedId(capteur?.id_conteneur || '');
  }, [capteur, show]);

  if (!show || !capteur) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    try {
      await onSubmit(capteur.id, selectedId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedId('');
    onClose();
  };

  return (
    <div className="cap-overlay" onClick={handleClose}>
      <div className="cap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cap-modal-header">
          <h3>
            <Link2 size={16} style={{ marginRight: 8, color: '#7c3aed' }} />
            Assigner à un conteneur
          </h3>
          <button className="cap-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="cap-modal-form">
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Capteur : <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{capteur.code_capteur}</strong>
            {capteur.id_conteneur && (
              <span style={{ marginLeft: 8, color: '#94a3b8' }}>
                (actuellement sur #{capteur.id_conteneur.slice(0, 8)})
              </span>
            )}
          </p>

          <div className="cap-field">
            <label>Conteneur *</label>
            <select
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— Choisir un conteneur —</option>
              {conteneurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code_conteneur || c.name} — {c.type || '—'}
                  {c.id === capteur.id_conteneur ? ' (actuel)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="cap-modal-footer">
            <button type="button" className="cap-btn-cancel" onClick={handleClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="cap-btn-confirm"
              disabled={loading || !selectedId || selectedId === capteur.id_conteneur}
              style={{ background: '#7c3aed' }}
            >
              {loading ? 'Assignation…' : 'Assigner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
