import React from 'react';
import { Plus, MapPin, Calendar, User, ClipboardList, Clock } from 'lucide-react';
import { TOURNEE_STATUS } from '../utils/constants';

export default function TourneesList({ tournees, selectedId, filter, loading, onSelect, onFilterChange, onCreateClick }) {
  const FILTERS = [
    ['all', 'Toutes'],
    ['today', "Aujourd'hui"],
    ['pending', 'À planifier'],
    ['in_progress', 'En cours'],
    ['done', 'Terminées'],
  ];

  return (
    <div className="tournees-left">
      <div className="tl-header">
        <h2>Tournées</h2>
        <button className="tl-btn-new" onClick={onCreateClick}>
          <Plus size={16} /> Nouvelle
        </button>
      </div>

      <div className="tl-tabs">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`tl-tab ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tl-list">
        {loading && <p className="tl-empty">Chargement…</p>}
        {!loading && tournees.length === 0 && (
          <p className="tl-empty">Aucune tournée{filter !== 'all' ? ' dans ce statut' : ''}</p>
        )}
        {tournees.map((t) => {
          const meta = TOURNEE_STATUS[t.status] || TOURNEE_STATUS.pending;
          return (
            <button
              key={t.id}
              className={`tl-card ${selectedId === t.id ? 'active' : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <div className="tlc-top">
                <span className="tlc-titre">{t.titre}</span>
                <span className="t-badge" style={{ color: meta.color, background: meta.bg }}>
                  {meta.label}
                </span>
              </div>
              <div className="tlc-meta">
                <span><MapPin size={12} /> {t.zone_nom || '—'}</span>
                <span><Calendar size={12} /> {t.date_prevue || '—'}</span>
                {t.heure_debut && <span><Clock size={12} /> {t.heure_debut}</span>}
              </div>
              <div className="tlc-meta">
                <span><User size={12} /> {t.agent_nom || 'Non assigné'}</span>
                <span><ClipboardList size={12} /> {t.signalements.length} signal.</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
