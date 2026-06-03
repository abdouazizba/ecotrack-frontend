import React from 'react';
import {
  Cpu, Trash2, Pencil, Package, Calendar,
  BatteryLow, BatteryMedium, BatteryFull, Link2,
  CheckCircle, WrenchIcon, PowerOff, Activity,
} from 'lucide-react';

const VALEUR_META = {
  REMPLISSAGE: { label: 'Taux de remplissage', unit: '%' },
  TEMPERATURE:  { label: 'Température',         unit: '°C' },
  SIGNAL:       { label: 'Signal',              unit: ' dBm' },
};

const STATUT_META = {
  ACTIF:          { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  INACTIF:        { label: 'Inactif',     color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const TYPE_META = {
  REMPLISSAGE: { label: 'Remplissage', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  TEMPERATURE:  { label: 'Température', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  SIGNAL:       { label: 'Signal',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

function BatteryIcon({ value }) {
  if (value === null || value === undefined) return null;
  const Icon = value < 25 ? BatteryLow : value < 60 ? BatteryMedium : BatteryFull;
  const color = value < 25 ? '#ef4444' : value < 60 ? '#f59e0b' : '#10b981';
  return <Icon size={16} style={{ color }} />;
}

function batteryColor(v) {
  if (v < 25) return '#ef4444';
  if (v < 60) return '#f59e0b';
  return '#10b981';
}

export default function CapteurDetail({
  capteur,
  onEdit,
  onDelete,
  onAssign,
  onStatutChange,
}) {
  if (!capteur) {
    return (
      <div className="cap-detail-empty">
        <Cpu size={48} strokeWidth={1.2} />
        <p>Sélectionnez un capteur pour voir ses détails</p>
      </div>
    );
  }

  const statut = STATUT_META[capteur.statut] || STATUT_META.INACTIF;
  const type   = TYPE_META[capteur.type]   || { label: capteur.type, color: '#64748b', bg: '#f1f5f9' };

  const date = capteur.created_at
    ? new Date(capteur.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className="cap-detail">
      {/* header */}
      <div className="cap-detail-header">
        <div className="cdh-left">
          <h2>{capteur.code_capteur}</h2>
          <div className="cdh-badges">
            <span className="cap-badge" style={{ color: statut.color, background: statut.bg }}>
              {statut.label}
            </span>
            <span className="cap-badge" style={{ color: type.color, background: type.bg }}>
              {type.label}
            </span>
          </div>
        </div>
        <div className="cap-header-actions">
          <button className="cap-btn-edit" onClick={() => onEdit(capteur)} title="Modifier">
            <Pencil size={15} />
          </button>
          <button
            className="cap-btn-delete"
            onClick={() => window.confirm('Supprimer ce capteur ?') && onDelete(capteur.id)}
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* meta */}
      <div className="cap-detail-meta">
        <span><Calendar size={14} /> {date}</span>
        {capteur.conteneur?.code_conteneur && (
          <span><Package size={14} /> {capteur.conteneur.code_conteneur}</span>
        )}
        {capteur.batterie !== null && capteur.batterie !== undefined && (
          <span>
            <BatteryIcon value={capteur.batterie} />
            Batterie : {capteur.batterie}%
          </span>
        )}
      </div>

      {/* info grid */}
      <div className="cap-detail-section">
        <h3><Cpu size={14} /> Informations</h3>
        <div className="cap-info-grid">
          <div className="cap-info-item">
            <label>Type</label>
            <span style={{ color: type.color }}>{type.label}</span>
          </div>
          <div className="cap-info-item">
            <label>Statut</label>
            <span style={{ color: statut.color }}>{statut.label}</span>
          </div>
          <div className="cap-info-item">
            <label>Conteneur assigné</label>
            <span>{capteur.conteneur?.code_conteneur || '—'}</span>
          </div>
          <div className="cap-info-item">
            <label>Batterie</label>
            {capteur.batterie !== null && capteur.batterie !== undefined ? (
              <>
                <span style={{ color: batteryColor(capteur.batterie) }}>{capteur.batterie}%</span>
                <div className="cap-battery-bar">
                  <div
                    className="cap-battery-fill"
                    style={{ width: `${capteur.batterie}%`, background: batteryColor(capteur.batterie) }}
                  />
                </div>
              </>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      </div>

      {/* mesure actuelle */}
      {capteur.valeur_actuelle !== null && capteur.valeur_actuelle !== undefined && (
        <div className="cap-detail-section">
          <h3><Activity size={14} /> Mesure actuelle</h3>
          <div className="cap-info-grid">
            <div className="cap-info-item">
              <label>{VALEUR_META[capteur.type]?.label || 'Valeur'}</label>
              <span style={{ color: type.color, fontWeight: 600, fontSize: 18 }}>
                {capteur.valeur_actuelle}{VALEUR_META[capteur.type]?.unit || ''}
              </span>
            </div>
            {capteur.derniere_mesure?.date_mesure && (
              <div className="cap-info-item">
                <label>Dernière mesure</label>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date(capteur.derniere_mesure.date_mesure).toLocaleString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* assign action */}
      <div className="cap-detail-section">
        <h3><Link2 size={14} /> Assignation conteneur</h3>
        <div className="cap-actions">
          <button className="cap-action-btn cap-action-assign" onClick={() => onAssign(capteur)}>
            <Link2 size={14} />
            {capteur.conteneur ? 'Réassigner à un conteneur' : 'Assigner à un conteneur'}
          </button>
        </div>
      </div>

      {/* statut actions */}
      <div className="cap-detail-section">
        <h3><CheckCircle size={14} /> Changer le statut</h3>
        <div className="cap-actions">
          {capteur.statut !== 'ACTIF' && (
            <button
              className="cap-action-btn cap-action-actif"
              onClick={() => onStatutChange(capteur.id, 'ACTIF')}
            >
              <CheckCircle size={14} /> Activer
            </button>
          )}
          {capteur.statut !== 'EN_MAINTENANCE' && (
            <button
              className="cap-action-btn cap-action-maintenance"
              onClick={() => onStatutChange(capteur.id, 'EN_MAINTENANCE')}
            >
              <WrenchIcon size={14} /> Maintenance
            </button>
          )}
          {capteur.statut !== 'INACTIF' && (
            <button
              className="cap-action-btn cap-action-inactif"
              onClick={() => onStatutChange(capteur.id, 'INACTIF')}
            >
              <PowerOff size={14} /> Désactiver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
