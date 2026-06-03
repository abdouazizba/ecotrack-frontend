import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TYPE_LABELS, PRIORITY_META } from '../utils/constants';

export default function AddSignalementsModal({ show, availableSigs, onClose, onSubmit }) {
  const [picked, setPicked] = useState([]);

  if (!show) return null;

  const toggle = (id) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = () => {
    onSubmit(picked);
    setPicked([]);
  };

  const handleClose = () => {
    setPicked([]);
    onClose();
  };

  return (
    <div className="t-overlay" onClick={handleClose}>
      <div className="t-modal t-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3>Ajouter des signalements</h3>
          <button className="t-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>
        <p className="t-modal-sub">Signalements ouverts disponibles ({availableSigs.length})</p>

        <div className="t-sig-pick-list">
          {availableSigs.length === 0 && (
            <p className="tl-empty">Aucun signalement disponible</p>
          )}
          {availableSigs.map((sig) => {
            const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
            return (
              <label key={sig.id} className={`t-sig-pick-item ${picked.includes(sig.id) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={picked.includes(sig.id)}
                  onChange={() => toggle(sig.id)}
                />
                <div className="tspi-info">
                  <span className="sig-type">{TYPE_LABELS[sig.type] || sig.type}</span>
                  <span className="t-badge" style={{ color: priority.color, background: `${priority.color}18` }}>
                    {priority.label}
                  </span>
                  {sig.description && <span className="tspi-desc">{sig.description}</span>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="t-modal-footer">
          <button type="button" className="t-btn-cancel" onClick={handleClose}>Annuler</button>
          <button
            type="button"
            className="t-btn-confirm"
            disabled={picked.length === 0}
            onClick={handleSubmit}
          >
            Ajouter ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}
