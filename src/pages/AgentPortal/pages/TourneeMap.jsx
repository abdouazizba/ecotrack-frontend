import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { ArrowRight, CheckCircle, Navigation } from 'lucide-react';

// ── Icon factory ──────────────────────────────────────────────────────────────
const PIN = {
  pending:     { bg: '#f59e0b', border: '#d97706' },
  in_progress: { bg: '#3b82f6', border: '#2563eb' },
  closed:      { bg: '#10b981', border: '#059669' },
  rejected:    { bg: '#ef4444', border: '#dc2626' },
};

const createSigIcon = (status, index) => {
  const { bg, border } = PIN[status] || PIN.pending;
  return L.divIcon({
    html: `<div style="background:${bg};width:32px;height:32px;border-radius:50%;border:3px solid ${border};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.35);">${index + 1}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -38],
  });
};

const createAgentIcon = () => L.divIcon({
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:agentRipple 1.8s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 6px rgba(59,130,246,0.6);"></div>
  </div>`,
  className: 'agent-icon-wrapper',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ── Auto-fit bounds ───────────────────────────────────────────────────────────
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const SIG_STATUS_LABEL = {
  pending:     'En attente',
  in_progress: 'En cours',
  closed:      'Clôturé',
  rejected:    'Rejeté',
};

const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function TourneeMap({ sigs, onTakeCharge, onStartClose }) {
  const [agentPos, setAgentPos] = useState(null);
  const [gpsError, setGpsError] = useState(false);

  // Agent GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError(true); return; }
    const wid = navigator.geolocation.watchPosition(
      (pos) => setAgentPos([pos.coords.latitude, pos.coords.longitude]),
      ()    => setGpsError(true),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  const withCoords = sigs.filter((s) => s.latitude != null && s.longitude != null);
  const noCoords   = sigs.filter((s) => s.latitude == null || s.longitude == null);
  const polyPoints = withCoords.map((s) => [s.latitude, s.longitude]);

  // Default center: first sig with coords, or Dakar
  const defaultCenter = polyPoints[0] || [14.6928, -17.4467];

  if (withCoords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: '#475569' }}>
        <Navigation size={28} strokeWidth={1.2} />
        <p style={{ fontSize: '0.82rem', margin: '8px 0 0' }}>
          Aucun signalement géolocalisé dans cette tournée
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Animation CSS inline */}
      <style>{`
        @keyframes agentRipple {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .agent-icon-wrapper { overflow: visible !important; }
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

      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: 380, width: '100%', borderRadius: 10, overflow: 'hidden' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        <FitBounds points={polyPoints} />

        {/* Polyligne itinéraire */}
        {polyPoints.length > 1 && (
          <Polyline
            positions={polyPoints}
            pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '8 6' }}
          />
        )}

        {/* Pins signalements */}
        {withCoords.map((s, i) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={createSigIcon(s.status, i)}>
            <Popup minWidth={210}>
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
                    {SIG_STATUS_LABEL[s.status] || s.status}
                  </span>
                </div>

                {s.description && (
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {s.description}
                  </p>
                )}

                {s.status === 'pending' && (
                  <button
                    onClick={() => onTakeCharge?.(s.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.18)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <ArrowRight size={13} /> Prendre en charge
                  </button>
                )}
                {s.status === 'in_progress' && (
                  <button
                    onClick={() => onStartClose?.(s.id)}
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

        {/* Position GPS de l'agent */}
        {agentPos && (
          <Marker position={agentPos} icon={createAgentIcon()}>
            <Popup>
              <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>📍 Votre position</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: '0.75rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> En attente
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> En cours
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Clôturé
        </span>
        {agentPos && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', display: 'inline-block' }} /> Vous
          </span>
        )}
        {gpsError && (
          <span style={{ color: '#f59e0b' }}>GPS non disponible</span>
        )}
        {noCoords.length > 0 && (
          <span style={{ color: '#475569' }}>{noCoords.length} signalement{noCoords.length > 1 ? 's' : ''} sans coordonnées (non affichés)</span>
        )}
      </div>
    </div>
  );
}
