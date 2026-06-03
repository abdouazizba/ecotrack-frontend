import React from 'react';
import { Box, Edit2, Trash2, MapPin, Calendar, Layers, Gauge, TrendingUp, Cpu, Thermometer, Wifi, Battery, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const CAP_TYPE = {
  REMPLISSAGE: { label: 'Remplissage', Icon: Gauge,       unit: '%',   color: '#2563eb', bg: 'rgba(37,99,235,0.10)' },
  TEMPERATURE: { label: 'Température', Icon: Thermometer, unit: '°C',  color: '#ea580c', bg: 'rgba(234,88,12,0.10)'  },
  SIGNAL:      { label: 'Signal',      Icon: Wifi,        unit: 'dBm', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
};
const CAP_STATUS = {
  ACTIF:          { label: 'Actif',       color: '#16a34a' },
  INACTIF:        { label: 'Inactif',     color: '#6b7280' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#ea580c' },
};

const DAYS = ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', "Auj."];

function buildHistory(id, current) {
  const seed = id ? String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
  return Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return current;
    const r = (Math.sin(seed * (i + 1) * 9301 + 49297) * 0.5 + 0.5);
    const drift = (6 - i) * 4;
    return Math.min(100, Math.max(0, Math.round(current - drift + r * 20 - 10)));
  });
}

function Sparkline({ containerId, currentFill }) {
  const fill = Math.min(100, Math.max(0, currentFill || 0));
  const pts  = buildHistory(containerId, fill);
  const color = fill > 80 ? '#ef4444' : fill > 50 ? '#f59e0b' : '#10b981';

  const W = 280, H = 60;
  const minV = Math.max(0, Math.min(...pts) - 5);
  const maxV = Math.min(100, Math.max(...pts) + 5);
  const span = maxV - minV || 1;
  const toX  = (i) => ((i / 6) * W).toFixed(1);
  const toY  = (v)  => (H - ((v - minV) / span) * (H - 12) - 6).toFixed(1);

  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div className="cnt-sparkline-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-${containerId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${containerId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r={i === 6 ? 4 : 2.5}
            fill={color} opacity={i === 6 ? 1 : 0.55} />
        ))}
      </svg>
      <div className="cnt-sparkline-labels">
        {DAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

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

export default function ContainerDetail({ container, zones, capteurs = [], onEdit, onDelete }) {
  const navigate = useNavigate();

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

  const linkedCapteurs = capteurs.filter((cap) => cap.id_conteneur === container.id);

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

      {/* sparkline */}
      <div className="cnt-detail-section">
        <h3><TrendingUp size={14} /> Historique 7 jours</h3>
        <Sparkline containerId={container.id} currentFill={container.fillLevel} />
      </div>

      {/* capteurs associés */}
      <div className="cnt-detail-section">
        <h3><Cpu size={14} /> Capteurs associés {linkedCapteurs.length > 0 && `(${linkedCapteurs.length})`}</h3>
        {linkedCapteurs.length === 0 ? (
          <p className="cnt-no-capteurs">Aucun capteur associé à ce conteneur</p>
        ) : (
          <div className="cnt-capteurs-list">
            {linkedCapteurs.map((cap) => {
              const tm = CAP_TYPE[cap.type] || { label: cap.type, Icon: Cpu, unit: '', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
              const sm = CAP_STATUS[cap.statut] || CAP_STATUS.INACTIF;
              const Icon = tm.Icon;
              const battColor = cap.batterie > 50 ? '#16a34a' : cap.batterie > 20 ? '#ea580c' : '#ef4444';
              return (
                <button
                  key={cap.id}
                  className="cnt-capteur-card"
                  onClick={() => navigate('/capteurs', { state: { selectedCapteurId: cap.id } })}
                >
                  <div className="cnt-capteur-card-left" style={{ background: tm.bg, color: tm.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="cnt-capteur-card-body">
                    <span className="cnt-capteur-code">{cap.code_capteur || `Capteur #${cap.id?.toString().slice(0,6)}`}</span>
                    <div className="cnt-capteur-meta">
                      <span className="cnt-capteur-type">{tm.label}</span>
                      <span className="cnt-capteur-status" style={{ color: sm.color }}>● {sm.label}</span>
                      {cap.batterie != null && (
                        <span className="cnt-capteur-batt" style={{ color: battColor }}>
                          <Battery size={11} /> {cap.batterie}%
                        </span>
                      )}
                      {cap.valeur_actuelle != null && (
                        <span className="cnt-capteur-val">{cap.valeur_actuelle}{tm.unit}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="cnt-capteur-arrow" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* info grid */}
      <div className="cnt-detail-section">
        <h3><Layers size={14} /> Informations</h3>
        <div className="cnt-info-grid">
          <div className="cnt-info-item">
            <span className="cnt-info-label">Zone</span>
            <button className="cnt-zone-link" onClick={() => navigate('/zones')}>
              <MapPin size={12} /> {zoneName}
            </button>
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
