import React, { useState, useEffect } from 'react';
import { X, UserCheck, ChevronRight } from 'lucide-react';
import { TYPE_LABELS } from '../utils/constants';

export default function AssignAgentModal({ show, signalement, agents, onClose, onSubmit }) {
  const [pickAgent, setPickAgent] = useState('');

  useEffect(() => {
    if (show) setPickAgent(signalement?.assigned_agent_id || '');
  }, [show, signalement]);

  if (!show || !signalement) return null;

  const handleSubmit = () => {
    const agent = agents.find((a) => a.id === pickAgent);
    onSubmit(signalement.id, agent);
    onClose();
  };

  return (
    <div className="t-overlay" onClick={onClose}>
      <div className="t-modal" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3>Assigner un agent</h3>
          <button className="t-modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>

        <p className="t-modal-sub">
          <strong>{TYPE_LABELS[signalement.type] || signalement.type}</strong>
          {signalement.description ? ` — ${signalement.description}` : ''}
        </p>

        <div className="t-agent-list">
          {agents.length === 0 && <p className="tl-empty">Aucun agent disponible</p>}
          {agents.map((a) => (
            <label
              key={a.id}
              className={`t-agent-item ${pickAgent === a.id ? 'selected' : ''}`}
              onClick={() => setPickAgent(a.id)}
            >
              <input type="radio" name="agent" value={a.id} checked={pickAgent === a.id} onChange={() => setPickAgent(a.id)} />
              <div className="tai-avatar">{(a.firstName?.[0] || 'A').toUpperCase()}</div>
              <div className="tai-info">
                <span className="tai-name">{a.firstName} {a.lastName}</span>
                <span className="tai-email">{a.email}</span>
              </div>
              {pickAgent === a.id && <ChevronRight size={16} className="tai-check" />}
            </label>
          ))}
        </div>

        <div className="t-modal-footer">
          <button type="button" className="t-btn-cancel" onClick={onClose}>Annuler</button>
          <button
            type="button"
            className="t-btn-confirm"
            disabled={!pickAgent}
            onClick={handleSubmit}
          >
            <UserCheck size={15} /> Assigner
          </button>
        </div>
      </div>
    </div>
  );
}
