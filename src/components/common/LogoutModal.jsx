import React from 'react';
import { LogOut, X } from 'lucide-react';
import './LogoutModal.css';

export default function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="lm-overlay" onClick={onCancel}>
      <div className="lm-card" onClick={(e) => e.stopPropagation()}>
        <button className="lm-close" onClick={onCancel} aria-label="Annuler">
          <X size={16} />
        </button>

        <div className="lm-icon-wrap">
          <LogOut size={22} />
        </div>

        <h2 className="lm-title">Se déconnecter ?</h2>
        <p className="lm-text">Vous allez quitter votre session EcoTrack.</p>

        <div className="lm-actions">
          <button className="lm-btn lm-btn--cancel" onClick={onCancel}>
            Annuler
          </button>
          <button className="lm-btn lm-btn--confirm" onClick={onConfirm}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
