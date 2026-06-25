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
  { value: 'pending',     label: 'Planifiée',  color: '#f59e0b', Icon: Clock },
  { value: 'in_progress', label: 'En cours',   color: '#3b82f6', Icon: Clock },
  { value: 'done',        label: 'Terminée',   color: '#10b981', Icon: CheckCircle },
  { value: 'cancelled',   label: 'Annulée',    color: '#6b7280', Icon: XCircle },
];

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const currentOpt = STATUS_OPTIONS.find((o) => o.value === current) || STATUS_OPTIONS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="tr-btn-status"
        style={{ background: currentOpt.color + '18', color: currentOpt.color, gap: 6 }}
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
                  if (window.confirm('Annuler cette tournée ?')) onChange(opt.value);
                } else {
                  onChange(opt.value);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', border: 'none', background: 'transparent',
                color: opt.color, fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
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

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '8px 0' }}>Chargement véhicule…</p>;
  if (!vehicule) return null;

  return (
    <div className="tr-team-section" style={{ marginTop: 0 }}>
      <div className="tras-label">
        <Truck size={16} />
        <span>Véhicule assigné</span>
      </div>
      <div className="tr-soutien-chips" style={{ marginTop: 6 }}>
        <span className="tr-soutien-chip" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
          <Truck size={12} />
          {vehicule.immatriculation}
          {vehicule.marque && <span style={{ opacity: 0.7, marginLeft: 4 }}>— {[vehicule.marque, vehicule.modele].filter(Boolean).join(' ')}</span>}
        </span>
        {vehicule.type_vehicule && (
          <span className="tr-soutien-chip" style={{ fontSize: '0.72rem' }}>
            {vehicule.type_vehicule === 'BENNE' ? 'Benne' : vehicule.type_vehicule === 'COMPACTEUR' ? 'Compacteur' : vehicule.type_vehicule === 'UTILITAIRE' ? 'Utilitaire' : vehicule.type_vehicule === 'CAMION_GRUE' ? 'Camion grue' : vehicule.type_vehicule}
            {vehicule.capacite_tonnes ? ` · ${vehicule.capacite_tonnes}t` : ''}
          </span>
        )}
        {conducteurName && (
          <span className="tr-soutien-chip" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
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
      <div className="tr-empty">
        <Package size={48} strokeWidth={1.2} />
        <p>Sélectionnez une tournée ou créez-en une nouvelle</p>
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
    <div className="tr-detail">
      {/* suggestion complétion automatique */}
      {tournee.status === 'in_progress' && allDone && (
        <div className="tr-completion-banner">
          <CheckCircle size={15} />
          <span>Tous les signalements sont traités —</span>
          <button onClick={() => onStatusChange(tournee.id, 'done')}>
            Marquer comme terminée
          </button>
        </div>
      )}

      {/* header */}
      <div className="tr-header">
        <div className="trh-left">
          <h2>{tournee.titre}</h2>
          <div className="trh-meta">
            <span><MapPin size={14} /> {tournee.zone_nom || '—'}</span>
            <span><Calendar size={14} /> {tournee.date_prevue || '—'}</span>
            <span className="t-badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
              {statusMeta.label}
            </span>
          </div>
        </div>
        <div className="trh-actions">
          <StatusDropdown
            current={tournee.status}
            onChange={(newStatus) => onStatusChange(tournee.id, newStatus)}
          />
          {onEditClick && (
            <button className="tr-btn-edit" onClick={() => onEditClick(tournee)} title="Modifier la tournée">
              <Edit2 size={15} />
            </button>
          )}
          <button className="tr-btn-delete" onClick={() => onDelete(tournee.id)} title="Supprimer la tournée">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* équipe (lecture seule — assignée à la création) */}
      <div className="tr-team-section">
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
              <div className="tr-agent-section">
                <div className="tras-label">
                  <UserCheck size={16} />
                  <span>Équipe assignée</span>
                </div>
                {allAgents.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '6px 0 0' }}>
                    Aucun agent — modifiez la tournée pour assigner une équipe
                  </p>
                ) : (
                  <div className="tr-soutien-chips" style={{ marginTop: 6 }}>
                    {conducteurs.map((a) => (
                      <span key={a.id} className="tr-soutien-chip" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <UserCheck size={12} /> {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>responsable</span>
                      </span>
                    ))}
                    {soutien.map((a) => (
                      <span key={a.id} className="tr-soutien-chip">
                        {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>soutien</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* véhicule */}
      <VehiculeInfo tournee={tournee} agents={agents} />

      {/* suivi temps */}
      {(tournee.heure_debut || tournee.heure_fin) && (
        <div className="tr-time-section">
          <Timer size={15} />
          {tournee.heure_debut && (
            <span>Début : <strong>{tournee.heure_debut}</strong></span>
          )}
          {tournee.heure_fin && (
            <span>Fin : <strong>{tournee.heure_fin}</strong></span>
          )}
          {(() => {
            const dur = parseDuration(tournee.heure_debut, tournee.heure_fin);
            return dur ? <span className="tr-duration">Durée : <strong>{dur}</strong></span> : null;
          })()}
        </div>
      )}

      {/* barre de progression */}
      {total > 0 && (
        <div className="tr-progress">
          <div className="tr-progress-label">
            <span>Traitement</span>
            <span>{closedCount} / {total} ({progress}%)</span>
          </div>
          <div className="tr-progress-bar">
            <div
              className="tr-progress-fill"
              style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#3b82f6' }}
            />
          </div>
        </div>
      )}

      {/* signalements */}
      <div className="tr-sigs-header">
        <h3>
          <AlertTriangle size={16} />
          Signalements ({total})
        </h3>
        <button className="tl-btn-new" onClick={onAddSigClick}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {sigsLoading ? (
        <div className="tr-sigs-empty">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Chargement des signalements…</p>
        </div>
      ) : total === 0 ? (
        <div className="tr-sigs-empty">
          <Package size={32} strokeWidth={1.2} />
          <p>Aucun signalement — cliquez sur Ajouter pour en inclure</p>
        </div>
      ) : (
        <div className="tr-sigs-list">
          {sigs.map((sig) => {
            const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
            return (
              <div key={sig.id} className="sig-card">
                <div className="sig-card-top">
                  <div className="sig-info">
                    <span className="sig-type">{TYPE_LABELS[sig.type] || sig.type}</span>
                    <span className="t-badge" style={{ color: priority.color, background: `${priority.color}18` }}>
                      {priority.label}
                    </span>
                  </div>
                  <button
                    className="sig-btn-remove"
                    onClick={() => onRemoveSignalement(sig.id)}
                    title="Retirer ce signalement"
                  >
                    <X size={14} />
                  </button>
                </div>
                {sig.description && <p className="sig-desc">{sig.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
