import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Clock, CheckCircle, MapPin, Calendar, XCircle,
  UserCheck, AlertTriangle, Package, X, Timer, Edit2, Truck, ChevronDown,
} from 'lucide-react';
import { TOURNEE_STATUS, TYPE_LABELS, PRIORITY_META } from '../utils/constants';
import { getVehiculesByAgent } from '../../../../services/api';

function parseDuration(debut, fin) {
  if (!debut || !fin) return null;
  const toSec = (t) => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 3600 + m * 60 + (s || 0);
  };
  const diff = toSec(fin) - toSec(debut);
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Planifiee',  color: '#f59e0b', Icon: Clock },
  { value: 'in_progress', label: 'En cours',   color: '#3b82f6', Icon: Clock },
  { value: 'done',        label: 'Terminee',   color: '#10b981', Icon: CheckCircle },
  { value: 'cancelled',   label: 'Annulee',    color: '#6b7280', Icon: XCircle },
];

const actionBtn = (bg, color) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, border: 'none',
  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
  background: bg, color, transition: 'opacity 0.15s',
  fontFamily: 'inherit',
});

const sectionTitle = {
  color: '#64748b', fontSize: '0.75rem', fontWeight: 700,
  textTransform: 'uppercase', margin: 0, letterSpacing: 0.5,
};

const infoCard = {
  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px',
};

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  marginBottom: 6, color: '#64748b', fontSize: '0.75rem',
};

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const currentOpt = STATUS_OPTIONS.find((o) => o.value === current) || STATUS_OPTIONS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          border: `1px solid ${currentOpt.color}40`,
          background: currentOpt.color + '18', color: currentOpt.color,
          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.2s',
        }}
      >
        <currentOpt.Icon size={13} />
        {currentOpt.label}
        <ChevronDown size={12} style={{ marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 50,
          background: '#1e2433', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, overflow: 'hidden', minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {STATUS_OPTIONS.filter((o) => o.value !== current).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setOpen(false);
                if (opt.value === 'cancelled') {
                  if (window.confirm('Annuler cette tournee ?')) onChange(opt.value);
                } else {
                  onChange(opt.value);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', border: 'none', background: 'transparent',
                color: opt.color, fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <opt.Icon size={13} /> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VehiculeInfo({ tournee, agents }) {
  const [vehicule, setVehicule] = useState(null);
  const [loading, setLoading] = useState(false);

  const conducteur = (tournee.agents || []).find((a) => a.role === 'CONDUCTEUR');
  const conducteurId = conducteur?.id;

  useEffect(() => {
    if (!conducteurId) { setVehicule(null); return; }
    let cancelled = false;
    setLoading(true);
    getVehiculesByAgent(conducteurId)
      .then((list) => { if (!cancelled) setVehicule(Array.isArray(list) && list.length > 0 ? list[0] : null); })
      .catch(() => { if (!cancelled) setVehicule(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [conducteurId]);

  const conducteurData = conducteurId ? agents.find((a) => String(a.id) === String(conducteurId)) : null;
  const conducteurName = conducteurData ? `${conducteurData.firstName} ${conducteurData.lastName}` : null;

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '8px 0' }}>Chargement vehicule...</p>;
  if (!vehicule) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...labelStyle, marginBottom: 0 }}>
        <Truck size={16} color="#8b5cf6" />
        <span style={sectionTitle}>Vehicule assigne</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
          background: 'rgba(139,92,246,0.12)', color: '#8b5cf6',
          border: '1px solid rgba(139,92,246,0.25)',
        }}>
          <Truck size={12} />
          {vehicule.immatriculation}
          {vehicule.marque && <span style={{ opacity: 0.7, marginLeft: 4 }}>- {[vehicule.marque, vehicule.modele].filter(Boolean).join(' ')}</span>}
        </span>
        {vehicule.type_vehicule && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 500,
            background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            {vehicule.type_vehicule === 'BENNE' ? 'Benne' : vehicule.type_vehicule === 'COMPACTEUR' ? 'Compacteur' : vehicule.type_vehicule === 'UTILITAIRE' ? 'Utilitaire' : vehicule.type_vehicule === 'CAMION_GRUE' ? 'Camion grue' : vehicule.type_vehicule}
            {vehicule.capacite_tonnes ? ` - ${vehicule.capacite_tonnes}t` : ''}
          </span>
        )}
        {conducteurName && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 500,
            background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            Conducteur : {conducteurName}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TourneeDetail({
  tournee,
  sigs: sigsProp,
  sigsLoading = false,
  agents,
  onStatusChange,
  onDelete,
  onAddSigClick,
  onRemoveSignalement,
  onEditClick,
}) {
  if (!tournee) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 16,
        color: '#94a3b8', padding: 40,
      }}>
        <Package size={48} strokeWidth={1.2} />
        <p style={{ fontSize: '0.92rem', textAlign: 'center', margin: 0 }}>
          Selectionnez une tournee ou creez-en une nouvelle
        </p>
      </div>
    );
  }

  const statusMeta   = TOURNEE_STATUS[tournee.status] || TOURNEE_STATUS.pending;
  const sigs         = sigsProp ?? tournee.signalements ?? [];
  const total        = sigs.length;
  const closedCount  = sigs.filter((s) => s.status === 'closed').length;
  const progress     = total > 0 ? Math.round((closedCount / total) * 100) : 0;
  const allDone      = total > 0 && closedCount === total;

  return (
    <div style={{
      background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: 24, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* completion suggestion banner */}
      {tournee.status === 'in_progress' && allDone && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 16px', background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10,
          color: '#10b981', fontSize: '0.82rem', fontWeight: 600,
        }}>
          <CheckCircle size={15} />
          <span>Tous les signalements sont traites --</span>
          <button
            onClick={() => onStatusChange(tournee.id, 'done')}
            style={{
              marginLeft: 'auto', padding: '6px 14px',
              background: '#10b981', color: '#fff', border: 'none',
              borderRadius: 7, fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Marquer comme terminee
          </button>
        </div>
      )}

      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, paddingBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 10px 0' }}>
            {tournee.titre}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
              <MapPin size={14} color="#64748b" /> {tournee.zone_nom || '-'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
              <Calendar size={14} color="#64748b" /> {tournee.date_prevue || '-'}
            </span>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
              color: statusMeta.color, background: statusMeta.bg,
            }}>
              {statusMeta.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusDropdown
            current={tournee.status}
            onChange={(newStatus) => onStatusChange(tournee.id, newStatus)}
          />
          {onEditClick && (
            <button
              onClick={() => onEditClick(tournee)}
              title="Modifier la tournee"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                color: '#3b82f6', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
            >
              <Edit2 size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(tournee.id)}
            title="Supprimer la tournee"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* team section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const allAgents = tournee.agents || [];
          const conducteurs = allAgents.filter((a) => a.role === 'CONDUCTEUR');
          const soutien = allAgents.filter((a) => a.role !== 'CONDUCTEUR');
          const resolveName = (a) => {
            const data = agents.find((ag) => String(ag.id) === String(a.id));
            return data ? `${data.firstName} ${data.lastName}` : `Agent ${String(a.id).slice(0, 8)}`;
          };

          return (
            <>
              <div style={{ ...labelStyle, marginBottom: 0 }}>
                <UserCheck size={16} color="#10b981" />
                <span style={sectionTitle}>Equipe assignee</span>
              </div>
              {allAgents.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '6px 0 0' }}>
                  Aucun agent -- modifiez la tournee pour assigner une equipe
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {conducteurs.map((a) => (
                    <span key={a.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                      background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                      border: '1px solid rgba(59,130,246,0.3)',
                    }}>
                      <UserCheck size={12} /> {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>responsable</span>
                    </span>
                  ))}
                  {soutien.map((a) => (
                    <span key={a.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                      background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>soutien</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* vehicle */}
      <VehiculeInfo tournee={tournee} agents={agents} />

      {/* time tracking */}
      {(tournee.heure_debut || tournee.heure_fin) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 10, padding: '10px 16px', fontSize: '0.82rem',
        }}>
          <Timer size={15} color="#10b981" />
          {tournee.heure_debut && (
            <span style={{ color: '#94a3b8' }}>Debut : <strong style={{ color: '#e2e8f0' }}>{tournee.heure_debut}</strong></span>
          )}
          {tournee.heure_fin && (
            <span style={{ color: '#94a3b8' }}>Fin : <strong style={{ color: '#e2e8f0' }}>{tournee.heure_fin}</strong></span>
          )}
          {(() => {
            const dur = parseDuration(tournee.heure_debut, tournee.heure_fin);
            return dur ? <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#10b981' }}>Duree : <strong>{dur}</strong></span> : null;
          })()}
        </div>
      )}

      {/* progress bar */}
      {total > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 8,
          }}>
            <span>Traitement</span>
            <span>{closedCount} / {total} ({progress}%)</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 10,
              width: `${progress}%`,
              background: progress === 100 ? '#10b981' : '#3b82f6',
              transition: 'width 0.4s ease, background 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* signalements header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0', margin: 0,
        }}>
          <AlertTriangle size={16} color="#f97316" />
          Signalements ({total})
        </h3>
        <button
          onClick={onAddSigClick}
          style={actionBtn('rgba(16,185,129,0.12)', '#10b981')}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {sigsLoading ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '40px 20px', color: '#94a3b8',
          border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 12,
        }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
            Chargement des signalements...
          </p>
        </div>
      ) : total === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '40px 20px', color: '#94a3b8',
          border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 12,
        }}>
          <Package size={32} strokeWidth={1.2} />
          <p style={{ fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
            Aucun signalement -- cliquez sur Ajouter pour en inclure
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sigs.map((sig) => {
            const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
            return (
              <div key={sig.id} style={{
                ...infoCard,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                      {TYPE_LABELS[sig.type] || sig.type}
                    </span>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                      color: priority.color, background: `${priority.color}18`,
                    }}>
                      {priority.label}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveSignalement(sig.id)}
                    title="Retirer ce signalement"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, background: 'transparent',
                      border: 'none', borderRadius: 6, color: '#94a3b8',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {sig.description && (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    {sig.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
