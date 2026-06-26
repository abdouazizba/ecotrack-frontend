import React from 'react';
import { MapPin, Calendar, User, ClipboardList, Clock } from 'lucide-react';
import { TOURNEE_STATUS } from '../utils/constants';

const formatDate = (raw) => {
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

export default function TourneesList({ tournees, selectedId, filter, loading, onSelect, hideFilters }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
        {loading && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 20, margin: 0, fontSize: '0.85rem' }}>
            Chargement...
          </p>
        )}
        {!loading && tournees.length === 0 && (
          <p style={{ color: '#475569', textAlign: 'center', padding: 40, margin: 0, fontSize: '0.85rem' }}>
            Aucune tournee{filter !== 'all' ? ' dans ce statut' : ''}
          </p>
        )}
        {tournees.map((t) => {
          const meta = TOURNEE_STATUS[t.status] || TOURNEE_STATUS.pending;
          const isSelected = selectedId === t.id;

          return (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                background: isSelected ? 'rgba(59,130,246,0.08)' : '#1e2433',
                border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10,
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${meta.color}15`,
                  color: meta.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ClipboardList size={16} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Top row: titre + status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      color: '#e2e8f0',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.titre}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: meta.color,
                      background: meta.bg,
                      padding: '2px 8px',
                      borderRadius: 20,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Row 2: zone + date */}
                <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} /> {t.zone_nom || '—'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} /> {formatDate(t.date_prevue) || '—'}
                  </span>
                  {t.heure_debut && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> {t.heure_debut}
                    </span>
                  )}
                </div>

                {/* Row 3: agent + signalements */}
                <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <User size={11} /> {t.agent_nom || 'Non assigné'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <ClipboardList size={11} /> {t.signalements.length} signal.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
