import React, { useState, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { TYPE_LABELS, PRIORITY_META } from '../utils/constants';

export default function AddSignalementsModal({
  show,
  allSigs,
  tournees = [],
  currentTourneeId,
  onClose,
  onSubmit,
}) {
  const [picked, setPicked] = useState([]);

  // Map sigId → tournée name pour les signalements déjà assignés ailleurs
  const assignedMap = useMemo(() => {
    const map = {};
    tournees.forEach((t) => {
      if (String(t.id) === String(currentTourneeId)) return;
      (t.signalements || []).forEach((s) => {
        map[s.id] = t.titre || `Tournée #${t.id}`;
      });
    });
    return map;
  }, [tournees, currentTourneeId]);

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

  const available = (allSigs || []).filter((s) => !assignedMap[s.id]);
  const assigned  = (allSigs || []).filter((s) =>  assignedMap[s.id]);

  return (
    <div className="t-overlay" onClick={handleClose}>
      <div className="t-modal t-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3>Ajouter des signalements</h3>
          <button className="t-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>
        <p className="t-modal-sub">
          {available.length} disponible{available.length !== 1 ? 's' : ''}
          {assigned.length > 0 && ` · ${assigned.length} déjà assigné${assigned.length !== 1 ? 's' : ''}`}
        </p>

        <div className="t-sig-pick-list">
          {available.length === 0 && assigned.length === 0 && (
            <p className="tl-empty">Aucun signalement ouvert</p>
          )}

          {/* signalements disponibles */}
          {available.map((sig) => {
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

          {/* séparateur si des signalements sont déjà assignés */}
          {assigned.length > 0 && (
            <>
              <div className="t-sig-divider">
                <AlertTriangle size={12} />
                <span>Déjà dans une autre tournée</span>
              </div>
              {assigned.map((sig) => {
                const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
                return (
                  <label
                    key={sig.id}
                    className={`t-sig-pick-item t-sig-pick-item--assigned ${picked.includes(sig.id) ? 'checked' : ''}`}
                  >
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
                      <span className="tspi-assigned-badge">
                        <AlertTriangle size={10} /> {assignedMap[sig.id]}
                      </span>
                      {sig.description && <span className="tspi-desc">{sig.description}</span>}
                    </div>
                  </label>
                );
              })}
            </>
          )}
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
