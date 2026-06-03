import React from 'react';
import { Plus, BatteryLow, BatteryMedium, BatteryFull, Cpu } from 'lucide-react';

const STATUT_META = {
  ACTIF:          { label: 'Actif',         color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  INACTIF:        { label: 'Inactif',       color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  EN_MAINTENANCE: { label: 'Maintenance',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const TYPE_META = {
  REMPLISSAGE: { label: 'Remplissage', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  TEMPERATURE:  { label: 'Température', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  SIGNAL:       { label: 'Signal',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const FILTERS = [
  ['all',           'Tous'],
  ['ACTIF',         'Actif'],
  ['INACTIF',       'Inactif'],
  ['EN_MAINTENANCE','Maintenance'],
];

function BatteryIcon({ value }) {
  if (value === null || value === undefined) return null;
  const Icon = value < 25 ? BatteryLow : value < 60 ? BatteryMedium : BatteryFull;
  const color = value < 25 ? '#ef4444' : value < 60 ? '#f59e0b' : '#10b981';
  return <Icon size={13} style={{ color }} />;
}

export default function CapteursList({
  capteurs, selectedId, filter, loading,
  onSelect, onFilterChange, onCreate,
}) {
  return (
    <div className="cap-left">
      <div className="cap-left-header">
        <h2>Capteurs</h2>
        <span className="cap-count-badge">{capteurs.length}</span>
        <button className="cap-btn-create" onClick={onCreate}>
          <Plus size={14} /> Nouveau
        </button>
      </div>

      <div className="cap-tabs">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`cap-tab ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="cap-list">
        {loading && <p className="cap-empty">Chargement…</p>}
        {!loading && capteurs.length === 0 && (
          <p className="cap-empty">
            {filter === 'all' ? 'Aucun capteur enregistré' : 'Aucun capteur dans ce statut'}
          </p>
        )}

        {capteurs.map((cap) => {
          const statut = STATUT_META[cap.statut] || STATUT_META.INACTIF;
          const type   = TYPE_META[cap.type]   || { label: cap.type, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };

          return (
            <button
              key={cap.id}
              className={`cap-card ${selectedId === cap.id ? 'active' : ''}`}
              onClick={() => onSelect(cap.id)}
            >
              <div className="cap-card-top">
                <span className="cap-card-code">{cap.code_capteur}</span>
                <span className="cap-badge" style={{ color: statut.color, background: statut.bg }}>
                  {statut.label}
                </span>
              </div>
              <div className="cap-card-meta">
                <span className="cap-badge" style={{ color: type.color, background: type.bg }}>
                  {type.label}
                </span>
                {cap.conteneur?.code_conteneur && (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {cap.conteneur.code_conteneur}
                  </span>
                )}
                {cap.batterie !== null && cap.batterie !== undefined && (
                  <span className="cap-battery">
                    <BatteryIcon value={cap.batterie} />
                    {cap.batterie}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
