import React from 'react';
import './ModalBrandPanel.css';

export default function ModalBrandPanel() {
  return (
    <div className="modal-brand">
      <div className="mbd-circle mbd-c1" />
      <div className="mbd-circle mbd-c2" />
      <div className="mbd-circle mbd-c3" />
      <div className="modal-brand-inner">
        <img src="/Logo-Ecotrack.png" alt="EcoBeast" className="modal-brand-logo" />
        <h2 className="modal-brand-name">EcoBeast</h2>
        <div className="modal-brand-divider" />
        <div className="modal-brand-tags">
        </div>
      </div>
    </div>
  );
}
