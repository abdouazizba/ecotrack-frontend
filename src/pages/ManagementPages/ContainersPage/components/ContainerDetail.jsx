import React from 'react';
import { Box, Edit2, Trash2, MapPin, Calendar, Layers, Gauge } from 'lucide-react';

const TYPE_META = {
  standard:  { label: 'Standard',   color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  selective: { label: 'Sélectif',   color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  organic:   { label: 'Organique',  color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  hazardous: { label: 'Dangereux',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
};

const STATUS_META = {
  actif:       { label: 'Actif',       color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  maintenance: { label: 'Maintenance', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  retire:      { label: 'Retiré',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  inactif:     { label: 'Inactif',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

function FillBar({ value }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const label = pct > 80 ? 'Critique' : pct > 50 ? 'Attention' : 'Normal';
  return (
    <div className="cnt-fillbar-wrap">
      <div className="cnt-fillbar-top">
        <span className="cnt-fillbar-pct" style={{ color }}>{pct}%</span>
        <span className="cnt-fillbar-label" style={{ color }}>{label}</span>
      </div>
      <div className="cnt-fillbar-track">
        <div
          className="cnt-fillbar-progress"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="cnt-fillbar-scale">
        <span>0 %</span><span>50 %</span><span>100 %</span>
      </div>
    </div>
  );
}

export default function ContainerDetail({ container, zones, onEdit, onDelete }) {
  if (!container) {
    return (
      <div className="cnt-detail-empty">
        <Box size={48} strokeWidth={1.2} />
        <p>Sélectionnez un conteneur pour voir ses détails</p>
      </div>
    );
  }

  const type   = TYPE_META[container.type]   || TYPE_META.standard;
  const status = STATUS_META[container.status] || STATUS_META.actif;
  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.nom || z.name]));
  const zoneName = zoneMap[container.zoneId] || container.zoneId || '—';

  const name = container.name || container.code_conteneur || `Conteneur #${container.id?.toString().slice(0, 6)}`;

  return (
    <div className="cnt-detail">
      {/* header */}
      <div className="cnt-detail-header">
        <div className="cntd-icon" style={{ background: type.bg, color: type.color }}>
          <Box size={28} />
        </div>
        <div className="cntd-title">
          <h2>{name}</h2>
          <div className="cntd-badges">
            <span className="cnt-badge" style={{ color: type.color, background: type.bg }}>{type.label}</span>
            <span className="cnt-badge" style={{ color: status.color, background: status.bg }}>{status.label}</span>
          </div>
        </div>
        <div className="cntd-actions">
          <button className="cntd-btn-edit" onClick={() => onEdit(container)}>
            <Edit2 size={15} /> Modifier
          </button>
          <button
            className="cntd-btn-delete"
            onClick={() => window.confirm('Supprimer ce conteneur ?') && onDelete(container.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* fill bar */}
      <div className="cnt-detail-section">
        <h3><Gauge size={14} /> Taux de remplissage</h3>
        <FillBar value={container.fillLevel} />
      </div>

      {/* info grid */}
      <div className="cnt-detail-section">
        <h3><Layers size={14} /> Informations</h3>
        <div className="cnt-info-grid">
          <div className="cnt-info-item">
            <span className="cnt-info-label">Zone</span>
            <span className="cnt-info-value"><MapPin size={12} /> {zoneName}</span>
          </div>
          <div className="cnt-info-item">
            <span className="cnt-info-label">Capacité</span>
            <span className="cnt-info-value">{container.capacity ?? '—'} L</span>
          </div>
          {container.date_installation && (
            <div className="cnt-info-item">
              <span className="cnt-info-label">Installation</span>
              <span className="cnt-info-value">
                <Calendar size={12} />
                {new Date(container.date_installation).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {container.created_at && (
            <div className="cnt-info-item">
              <span className="cnt-info-label">Créé le</span>
              <span className="cnt-info-value">
                {new Date(container.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {container.latitude != null && (
            <div className="cnt-info-item">
              <span className="cnt-info-label">Coordonnées</span>
              <span className="cnt-info-value">
                {container.latitude?.toFixed(5)}, {container.longitude?.toFixed(5)}
              </span>
            </div>
          )}
          {container.notes && (
            <div className="cnt-info-item cnt-info-full">
              <span className="cnt-info-label">Notes</span>
              <span className="cnt-info-value">{container.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
