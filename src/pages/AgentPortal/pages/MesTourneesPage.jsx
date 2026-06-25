import React, { useEffect, useState, useCallback } from 'react';
import {
  Route, Calendar, CheckCircle, Clock, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Image, AlertTriangle, Package, ArrowRight,
  List, Map, Users, User, PlayCircle, Truck, History, Thermometer,
  Activity, X,
} from 'lucide-react';
import {
  getTourneesByAgent,
  updateTourneeStatus,
  getSignalementsByTournee,
  patchSignalement,
  getVehiculesByAgent,
  getMesuresConteneur,
  getContainer,
  getAgents,
} from '../../../services/api';
import TourneeMap from './TourneeMap';
import useAuthStore from '../../../store/authStore';

const STATUS_META = {
  pending:     { label: 'Planifiée',  color: '#f59e0b', Icon: Clock },
  in_progress: { label: 'En cours',   color: '#3b82f6', Icon: AlertCircle },
  done:        { label: 'Terminée',   color: '#10b981', Icon: CheckCircle },
  cancelled:   { label: 'Annulée',    color: '#ef4444', Icon: XCircle },
};

const SIG_STATUS = {
  pending:     { label: 'En attente',  color: '#f59e0b' },
  in_progress: { label: 'En cours',    color: '#3b82f6' },
  closed:      { label: 'Clôturé',     color: '#10b981' },
  rejected:    { label: 'Rejeté',      color: '#ef4444' },
};

const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const btn = (extra = {}) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 14px', borderRadius: 7, border: 'none',
  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
  ...extra,
});

const isTodayOrPast = (dateStr) => {
  if (!dateStr) return false;
  const scheduled = new Date(dateStr);
  scheduled.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scheduled <= today;
};

const formatAgentName = (agent) => {
  const name = [agent.prenom, agent.nom].filter(Boolean).join(' ');
  return name || `Agent ${String(agent.id).slice(0, 6)}`;
};

// ── Inline close modal ────────────────────────────────────────────────────────
function CloseModal({ sigId, onConfirm, onCancel, submitting }) {
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes]             = useState('');

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => onConfirm(sigId, photoFile, notes);

  const handleCancel = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    onCancel();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={handleCancel}
    >
      <div
        style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, width: 340, maxWidth: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 14px', fontSize: '1rem' }}>Clôturer le signalement</h3>

        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 8px' }}>
          Photo de preuve <span style={{ color: '#ef4444' }}>*</span>
        </p>
        <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />
          {photoPreview ? (
            <img src={photoPreview} alt="Aperçu" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
          ) : (
            <div style={{ border: '1.5px dashed rgba(255,255,255,0.15)', borderRadius: 8, height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#475569' }}>
              <Image size={20} />
              <span style={{ fontSize: '0.78rem' }}>Importer depuis l'appareil</span>
            </div>
          )}
        </label>

        <textarea
          placeholder="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: '0.82rem', resize: 'vertical', marginBottom: 14, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCancel}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!photoFile || submitting}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: photoFile ? 'pointer' : 'not-allowed', background: photoFile ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <CheckCircle size={14} /> {submitting ? 'Envoi…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal historique conteneur ────────────────────────────────────────────────
function ContainerHistoryModal({ containerId, onClose }) {
  const [container, setContainer] = useState(null);
  const [mesures, setMesures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getContainer(containerId).catch(() => null),
      getMesuresConteneur(containerId).catch(() => []),
    ]).then(([c, m]) => {
      if (cancelled) return;
      setContainer(c);
      setMesures(Array.isArray(m) ? m.slice(0, 20) : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [containerId]);

  const fillColor = (val) => {
    if (val >= 80) return '#ef4444';
    if (val >= 50) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, width: 440, maxWidth: '94vw', maxHeight: '85vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} color="#3b82f6" /> Historique du conteneur
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {loading && <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Chargement…</p>}

        {!loading && (
          <>
            {/* Infos conteneur */}
            {container && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                    {container.code_conteneur || container.name || `Conteneur`}
                  </p>
                  {container.type && (
                    <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600 }}>
                      {container.type}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {container.capacity && (
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Capacité : {container.capacity}L</span>
                  )}
                  {container.address && (
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{container.address}</span>
                  )}
                </div>
              </div>
            )}

            {/* Mesures récentes */}
            {mesures.length > 0 ? (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mesures récentes ({mesures.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mesures.map((m, i) => {
                    const val = m.valeur ?? m.niveau_remplissage ?? m.value;
                    const temp = m.temperature;
                    const date = m.created_at || m.date_mesure || m.createdAt;
                    const dateStr = date
                      ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—';

                    return (
                      <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Barre de remplissage */}
                        {val != null && (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.min(val, 100)}%`, background: fillColor(val), opacity: 0.3, borderRadius: '0 0 8px 8px' }} />
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fillColor(val), fontSize: '0.7rem', fontWeight: 700 }}>
                              {Math.round(val)}%
                            </span>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            {val != null && (
                              <span style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Activity size={11} /> Remplissage : {Math.round(val)}%
                              </span>
                            )}
                            {temp != null && (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Thermometer size={11} /> {temp}°C
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#475569', fontSize: '0.68rem', marginTop: 2, display: 'block' }}>
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569' }}>
                <Activity size={24} strokeWidth={1.2} />
                <p style={{ fontSize: '0.82rem', margin: '6px 0 0' }}>Aucune mesure enregistrée</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Signalements d'une tournée ────────────────────────────────────────────────
function TourneeSignalements({ tourneeId, tourneeStatus, onUpdate }) {
  const [sigs, setSigs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [historyContainerId, setHistoryContainerId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getSignalementsByTournee(tourneeId);
    setSigs(data);
    setLoading(false);
  }, [tourneeId]);

  useEffect(() => { load(); }, [load]);

  const handleTakeCharge = async (id) => {
    setSigs((prev) => prev.map((s) => s.id === id ? { ...s, status: 'in_progress' } : s));
    try {
      await patchSignalement(id, { status: 'in_progress' });
      await load();
      onUpdate?.();
    } catch {
      setError('Erreur lors de la prise en charge');
      await load();
    }
  };

  const handleCloseConfirm = async (id, photoFile, notes) => {
    if (!photoFile) return;
    setSubmitting(true);
    try {
      await patchSignalement(id, { status: 'closed', photoFile, notes });
      setClosingId(null);
      await load();
      onUpdate?.();
    } catch {
      setError('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.8rem', padding: '8px 0' }}>Chargement…</p>;

  if (sigs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569' }}>
        <Package size={28} strokeWidth={1.2} />
        <p style={{ fontSize: '0.82rem', margin: '6px 0 0' }}>Aucun signalement dans cette tournée</p>
      </div>
    );
  }

  const tabBtn = (mode, Icon, label) => (
    <button
      onClick={() => setViewMode(mode)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600,
        background: viewMode === mode ? '#3b82f6' : 'rgba(255,255,255,0.07)',
        color: viewMode === mode ? '#fff' : '#64748b',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <>
      {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {tabBtn('list', List, 'Liste')}
        {tabBtn('map',  Map,  'Carte')}
      </div>

      {viewMode === 'map' && (
        <TourneeMap
          sigs={sigs}
          onTakeCharge={handleTakeCharge}
          onStartClose={(id) => setClosingId(id)}
        />
      )}

      {viewMode === 'list' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sigs.map((s) => {
          const meta = SIG_STATUS[s.status] || SIG_STATUS.pending;
          const date = s.created_at
            ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : '—';
          return (
            <div
              key={s.id}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                  {TYPE_LABELS[s.type] || s.type || 'Signalement'}
                </p>
                <span style={{ padding: '2px 8px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, fontSize: '0.72rem', fontWeight: 600 }}>
                  {meta.label}
                </span>
              </div>
              {s.description && <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 8px' }}>{s.description}</p>}
              <span style={{ color: '#475569', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                <Calendar size={10} /> {date}
              </span>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.id_conteneur && (
                  <button
                    onClick={() => setHistoryContainerId(s.id_conteneur)}
                    style={btn({ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' })}
                  >
                    <History size={12} /> Historique
                  </button>
                )}
                {s.status === 'pending' && tourneeStatus === 'in_progress' && (
                  <button
                    onClick={() => handleTakeCharge(s.id)}
                    style={btn({ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' })}
                  >
                    <ArrowRight size={12} /> Prendre en charge
                  </button>
                )}
                {s.status === 'in_progress' && (
                  <button
                    onClick={() => setClosingId(s.id)}
                    style={btn({ background: 'rgba(16,185,129,0.12)', color: '#10b981' })}
                  >
                    <CheckCircle size={12} /> Clôturer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {closingId && (
        <CloseModal
          sigId={closingId}
          submitting={submitting}
          onConfirm={handleCloseConfirm}
          onCancel={() => setClosingId(null)}
        />
      )}

      {historyContainerId && (
        <ContainerHistoryModal
          containerId={historyContainerId}
          onClose={() => setHistoryContainerId(null)}
        />
      )}
    </>
  );
}

// ── Détails planning d'une tournée ───────────────────────────────────────────
function TourneeDetails({ tournee, resolveAgentName: resolveAgent }) {
  const agents = tournee.agents || [];
  const chef = agents.find((a) => a.role === 'CONDUCTEUR');
  const equipe = agents.filter((a) => a.role !== 'CONDUCTEUR');
  const [vehicule, setVehicule] = useState(null);
  const [vehiculeLoading, setVehiculeLoading] = useState(false);

  const vehiculeAgentId = chef?.id || tournee.agent_id;

  useEffect(() => {
    if (!vehiculeAgentId) return;
    let cancelled = false;
    setVehiculeLoading(true);
    getVehiculesByAgent(vehiculeAgentId)
      .then((list) => { if (!cancelled) setVehicule(Array.isArray(list) && list.length > 0 ? list[0] : null); })
      .catch(() => { if (!cancelled) setVehicule(null); })
      .finally(() => { if (!cancelled) setVehiculeLoading(false); });
    return () => { cancelled = true; };
  }, [vehiculeAgentId]);

  const TYPE_VEHICULE_LABELS = {
    BENNE: 'Benne', COMPACTEUR: 'Compacteur', UTILITAIRE: 'Utilitaire', CAMION_GRUE: 'Camion grue',
  };

  const infoRow = (icon, label, value) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <div style={{ color: '#64748b', flexShrink: 0 }}>{icon}</div>
      <span style={{ color: '#64748b', fontSize: '0.78rem', minWidth: 100 }}>{label}</span>
      <span style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {/* Planning */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} /> Planning
        </h4>
        {infoRow(<Calendar size={13} />, 'Date prévue',
          tournee.date_prevue
            ? new Date(tournee.date_prevue).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : null
        )}
        {infoRow(<Clock size={13} />, 'Heure de départ', tournee.heure_debut || null)}
        {infoRow(<Clock size={13} />, 'Heure de fin', tournee.heure_fin || null)}
        {tournee.zone_nom && infoRow(<Map size={13} />, 'Zone', tournee.zone_nom)}
      </div>

      {/* Équipe */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} /> Équipe ({agents.length})
        </h4>

        {chef && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resolveAgent(chef)}
              </p>
              <span style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600 }}>Chef d'équipe</span>
            </div>
          </div>
        )}

        {equipe.length > 0 ? equipe.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={12} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resolveAgent(a)}
              </p>
              <span style={{ color: '#64748b', fontSize: '0.68rem' }}>Collecteur</span>
            </div>
          </div>
        )) : !chef && (
          <p style={{ color: '#475569', fontSize: '0.78rem', margin: '8px 0 0' }}>Aucun agent assigné</p>
        )}
      </div>

      {/* Véhicule */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Truck size={13} /> Véhicule
        </h4>

        {vehiculeLoading && <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>Chargement…</p>}

        {!vehiculeLoading && vehicule && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(139,92,246,0.08)', borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vehicule.immatriculation}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0 0 2px' }}>
                {[vehicule.marque, vehicule.modele].filter(Boolean).join(' ')}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {vehicule.type_vehicule && (
                  <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontSize: '0.65rem', fontWeight: 600 }}>
                    {TYPE_VEHICULE_LABELS[vehicule.type_vehicule] || vehicule.type_vehicule}
                  </span>
                )}
                {vehicule.capacite_tonnes && (
                  <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                    {vehicule.capacite_tonnes}t
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!vehiculeLoading && !vehicule && (
          <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>Aucun véhicule assigné</p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MesTourneesPage() {
  const { user }               = useAuthStore();
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState(null);
  const [filter, setFilter]    = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [alertTournee, setAlertTournee] = useState(null);
  const [agentsData, setAgentsData] = useState([]);

  useEffect(() => {
    getAgents().then((list) => setAgentsData(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  const resolveAgentName = useCallback((agent) => {
    const data = agentsData.find((ag) => String(ag.id) === String(agent.id));
    if (data) return `${data.firstName} ${data.lastName}`;
    return formatAgentName(agent);
  }, [agentsData]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getTourneesByAgent(user.id);
      setTournees(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Impossible de charger les tournées');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? tournees : tournees.filter((t) => t.status === filter);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateTourneeStatus(id, status);
      setError(null);
      await load();
    } catch (err) {
      const serverMsg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || err.response?.data?.error
        || 'Erreur lors de la mise à jour du statut';
      setError(serverMsg);
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Route size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Mes tournées</h1>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 500,
              background: filter === f ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: filter === f ? '#fff' : '#94a3b8',
            }}
          >
            {f === 'all' ? 'Toutes' : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: 48 }}>Aucune tournée trouvée.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((t) => {
          const meta     = STATUS_META[t.status] || STATUS_META.pending;
          const Icon     = meta.Icon;
          const expanded = expandedId === t.id;
          const isUpdating = updating === t.id;
          const canStart = isTodayOrPast(t.date_prevue);
          const date = t.date_prevue
            ? new Date(t.date_prevue).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
            : '—';
          const chef = (t.agents || []).find((a) => a.role === 'CONDUCTEUR');
          const teamSize = (t.agents || []).length;

          return (
            <div
              key={t.id}
              style={{ background: '#1e2433', border: `1px solid ${expanded ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
            >
              {/* En-tête de la carte */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${meta.color}18`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 3px', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.titre || t.code || `Tournée #${t.id?.slice(0, 8)}`}
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {date}
                    </span>
                    {t.heure_debut && (
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {t.heure_debut}
                      </span>
                    )}
                    {t.zone_nom && (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>· {t.zone_nom}</span>
                    )}
                    {chef && (
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <User size={10} /> {resolveAgentName(chef)}
                      </span>
                    )}
                    {teamSize > 0 && (
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users size={10} /> {teamSize}
                      </span>
                    )}
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, fontSize: '0.72rem', fontWeight: 600 }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Actions de statut */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {t.status === 'pending' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canStart) {
                          handleStatusChange(t.id, 'in_progress');
                        } else {
                          setAlertTournee(t);
                        }
                      }}
                      style={btn({
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3b82f6',
                        opacity: isUpdating ? 0.6 : 1,
                      })}
                    >
                      <PlayCircle size={12} /> Démarrer
                    </button>
                  )}
                  {t.status === 'in_progress' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'done'); }}
                      style={btn({ background: 'rgba(16,185,129,0.15)', color: '#10b981', opacity: isUpdating ? 0.6 : 1 })}
                    >
                      <CheckCircle size={12} /> Terminer
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(t.id)}
                    title={expanded ? 'Réduire' : 'Voir les détails'}
                    style={{ padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Section détails (expandable) */}
              {expanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px' }}>
                  {/* Détails planning & équipe */}
                  <TourneeDetails tournee={t} resolveAgentName={resolveAgentName} />

                  {/* Signalements */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <AlertTriangle size={13} color="#f59e0b" />
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Signalements à traiter</span>
                    </div>
                    <TourneeSignalements tourneeId={t.id} tourneeStatus={t.status} onUpdate={load} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal alerte date non atteinte */}
      {alertTournee && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setAlertTournee(null)}
        >
          <div
            style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, width: 380, maxWidth: '92vw', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <AlertCircle size={24} />
            </div>
            <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 8px', fontSize: '1rem' }}>
              Tournée pas encore disponible
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 6px', lineHeight: 1.5 }}>
              Cette tournée est prévue pour le
            </p>
            <p style={{ color: '#f59e0b', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px' }}>
              {alertTournee.date_prevue
                ? new Date(alertTournee.date_prevue).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 20px' }}>
              Vous pourrez la démarrer à partir de cette date.
            </p>
            <button
              onClick={() => setAlertTournee(null)}
              style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
