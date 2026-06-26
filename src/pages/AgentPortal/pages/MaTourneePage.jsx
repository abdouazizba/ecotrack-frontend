import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import {
  Navigation, ArrowRight, CheckCircle, Image, AlertTriangle,
  Route, RefreshCw,
} from 'lucide-react';
import UserLocationMarker from '../../../components/common/UserLocationMarker';
import {
  getTourneesByAgent,
  getSignalementsByTournee,
  patchSignalement,
  updateTourneeStatus,
} from '../../../services/api';
import useAuthStore from '../../../store/authStore';

const PIN = {
  pending:     { bg: '#f59e0b', border: '#d97706' },
  in_progress: { bg: '#3b82f6', border: '#2563eb' },
  closed:      { bg: '#10b981', border: '#059669' },
  rejected:    { bg: '#ef4444', border: '#dc2626' },
};

const SIG_LABEL = {
  pending: 'En attente', in_progress: 'En cours', closed: 'Clôturé', rejected: 'Rejeté',
};

const TYPE_LABELS = {
  overflowing: 'Débordement', full: 'Conteneur plein', damaged: 'Conteneur endommagé',
  smell: 'Mauvaise odeur', other: 'Autre',
};

const createSigIcon = (status, index) => {
  const { bg, border } = PIN[status] || PIN.pending;
  return L.divIcon({
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;border:3px solid ${border};display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.4);">${index + 1}</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -40],
  });
};

const createAgentIcon = () => L.divIcon({
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:agentPulse 1.8s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>
  </div>`,
  className: 'agent-icon-wrap',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [map, points.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function RecenterButton({ agentPos }) {
  const map = useMap();
  if (!agentPos) return null;
  return (
    <button
      onClick={() => map.setView(agentPos, 16)}
      title="Recentrer sur ma position"
      style={{
        position: 'absolute', bottom: 20, right: 12, zIndex: 1000,
        width: 40, height: 40, borderRadius: '50%',
        background: '#1e2433', border: '2px solid rgba(59,130,246,0.5)',
        color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      <Navigation size={18} />
    </button>
  );
}

function CloseModal({ sigId, onConfirm, onCancel, submitting }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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
          <button onClick={handleCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(sigId, photoFile, notes)}
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

export default function MaTourneePage() {
  const { user } = useAuthStore();
  const [tournee, setTournee] = useState(null);
  const [sigs, setSigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentPos, setAgentPos] = useState(null);
  const [gpsError, setGpsError] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const all = await getTourneesByAgent(user.id);
      const active = Array.isArray(all) ? all.find((t) => t.status === 'in_progress') : null;
      setTournee(active || null);
      if (active) {
        const data = await getSignalementsByTournee(active.id);
        setSigs(data);
      } else {
        setSigs([]);
      }
      setError(null);
    } catch {
      setError('Impossible de charger la tournée');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsError(true); return; }
    const wid = navigator.geolocation.watchPosition(
      (pos) => setAgentPos([pos.coords.latitude, pos.coords.longitude]),
      () => setGpsError(true),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  const handleTakeCharge = async (id) => {
    setSigs((prev) => prev.map((s) => s.id === id ? { ...s, status: 'in_progress' } : s));
    try {
      await patchSignalement(id, { status: 'in_progress' });
      await load();
    } catch {
      setError('Erreur lors de la prise en charge');
      await load();
    }
  };

  const handleClose = async (id, photoFile, notes) => {
    if (!photoFile) return;
    setSubmitting(true);
    try {
      await patchSignalement(id, { status: 'closed', photoFile, notes });
      setClosingId(null);
      await load();
    } catch {
      setError('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!tournee) return;
    try {
      await updateTourneeStatus(tournee.id, 'done');
      await load();
    } catch {
      setError('Erreur lors de la fin de tournée');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Chargement…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!tournee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#475569' }}>
        <Route size={40} strokeWidth={1.2} />
        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Aucune tournée en cours</p>
        <p style={{ fontSize: '0.82rem', margin: 0, textAlign: 'center', maxWidth: 300 }}>
          Rendez-vous dans <strong style={{ color: '#3b82f6' }}>Mes tournées</strong> pour démarrer une tournée planifiée.
        </p>
      </div>
    );
  }

  const withCoords = sigs.filter((s) => s.latitude != null && s.longitude != null);
  const polyPoints = withCoords.map((s) => [s.latitude, s.longitude]);
  const defaultCenter = agentPos || polyPoints[0] || [48.8566, 2.3522];

  const pending = sigs.filter((s) => s.status === 'pending').length;
  const inProgress = sigs.filter((s) => s.status === 'in_progress').length;
  const closed = sigs.filter((s) => s.status === 'closed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <style>{`
        @keyframes agentPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .agent-icon-wrap { overflow: visible !important; }
        .leaflet-popup-content-wrapper {
          background: #1e2433 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip { background: #1e2433 !important; }
        .leaflet-popup-content { margin: 12px 14px !important; }
        .leaflet-popup-close-button { color: #64748b !important; }
      `}</style>

      {/* Header bar */}
      <div style={{ padding: '12px 20px', background: '#1e2433', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Navigation size={18} color="#3b82f6" />
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tournee.titre || tournee.code || 'Tournée en cours'}
          </span>
          <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>
            En cours
          </span>
        </div>

        {/* Stats compactes */}
        <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> {pending} en attente
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> {inProgress} en cours
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> {closed} traités
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={load}
            title="Rafraîchir"
            style={{ padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={handleFinish}
            style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <CheckCircle size={13} /> Terminer
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {gpsError && (
        <div style={{ padding: '6px 20px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={13} /> GPS non disponible — activez la géolocalisation
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {withCoords.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', gap: 8 }}>
            <Navigation size={32} strokeWidth={1.2} />
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Aucun signalement géolocalisé</p>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />

            <UserLocationMarker flyTo />
            <FitBounds points={agentPos ? [agentPos, ...polyPoints] : polyPoints} />
            <RecenterButton agentPos={agentPos} />

            {polyPoints.length > 1 && (
              <Polyline
                positions={polyPoints}
                pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '8 6' }}
              />
            )}

            {withCoords.map((s, i) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={createSigIcon(s.status, i)}>
                <Popup minWidth={220}>
                  <div style={{ color: '#e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.85rem' }}>
                        #{i + 1} — {TYPE_LABELS[s.type] || s.type || 'Signalement'}
                      </strong>
                      <span style={{
                        padding: '2px 7px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                        background: `${(PIN[s.status] || PIN.pending).bg}22`,
                        color: (PIN[s.status] || PIN.pending).bg,
                      }}>
                        {SIG_LABEL[s.status] || s.status}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px', lineHeight: 1.4 }}>
                        {s.description}
                      </p>
                    )}
                    {s.status === 'pending' && (
                      <button
                        onClick={() => handleTakeCharge(s.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.18)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <ArrowRight size={13} /> Prendre en charge
                      </button>
                    )}
                    {s.status === 'in_progress' && (
                      <button
                        onClick={() => setClosingId(s.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.18)', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <CheckCircle size={13} /> Clôturer
                      </button>
                    )}
                    {s.status === 'closed' && (
                      <p style={{ textAlign: 'center', color: '#10b981', fontSize: '0.78rem', margin: 0 }}>✓ Traité</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {agentPos && (
              <Marker position={agentPos} icon={createAgentIcon()}>
                <Popup>
                  <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>Votre position</p>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>

      {closingId && (
        <CloseModal
          sigId={closingId}
          submitting={submitting}
          onConfirm={handleClose}
          onCancel={() => setClosingId(null)}
        />
      )}
    </div>
  );
}
