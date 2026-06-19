import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function FitAllZones({ zones }) {
  const map = useMap();
  React.useEffect(() => {
    const pts = zones.filter(z => z.latitude && z.longitude).map(z => [z.latitude, z.longitude]);
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
    else if (pts.length === 1) map.setView(pts[0], 13);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function ZoneMapPicker({ zones, selectedIds, sigCounts, onToggle }) {
  const withCoords = useMemo(
    () => zones.filter(z => z.latitude && z.longitude),
    [zones]
  );

  const center = useMemo(() => {
    if (!withCoords.length) return [48.8566, 2.3522];
    const lat = withCoords.reduce((s, z) => s + z.latitude, 0) / withCoords.length;
    const lng = withCoords.reduce((s, z) => s + z.longitude, 0) / withCoords.length;
    return [lat, lng];
  }, [withCoords]);

  const getColor = (zone) => {
    if (selectedIds.includes(zone.id)) return '#10b981';
    const count = sigCounts[zone.id] || 0;
    if (count > 3) return '#ef4444';
    if (count > 0) return '#f59e0b';
    return '#475569';
  };

  const getRadius = (zone) => {
    const count = sigCounts[zone.id] || 0;
    if (selectedIds.includes(zone.id)) return 10;
    if (count > 3) return 9;
    if (count > 0) return 7;
    return 5;
  };

  return (
    <div>
      <style>{`
        .zone-map .leaflet-popup-content-wrapper {
          background: #1e2433 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .zone-map .leaflet-popup-tip { background: #1e2433 !important; }
        .zone-map .leaflet-popup-content { margin: 10px 12px !important; }
        .zone-map .leaflet-popup-close-button { color: #64748b !important; }
      `}</style>

      <MapContainer
        center={center}
        zoom={11}
        className="zone-map"
        style={{ height: 280, width: '100%', borderRadius: 10, overflow: 'hidden' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />
        <FitAllZones zones={withCoords} />

        {withCoords.map(zone => {
          const count = sigCounts[zone.id] || 0;
          const selected = selectedIds.includes(zone.id);
          return (
            <CircleMarker
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={getRadius(zone)}
              pathOptions={{
                fillColor: getColor(zone),
                fillOpacity: selected ? 0.9 : 0.6,
                color: selected ? '#fff' : 'transparent',
                weight: selected ? 2 : 0,
              }}
              eventHandlers={{ click: () => onToggle(zone.id) }}
            >
              <Popup>
                <div style={{ color: '#e2e8f0', minWidth: 160 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 4px' }}>{zone.nom}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 8px' }}>
                    {count > 0
                      ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{count} signalement{count > 1 ? 's' : ''}</span>
                      : 'Aucun signalement'}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(zone.id); }}
                    style={{
                      width: '100%', padding: '6px 0', borderRadius: 7, border: 'none',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: selected ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: selected ? '#ef4444' : '#10b981',
                    }}
                  >
                    {selected ? 'Retirer' : 'Ajouter'}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legende */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1.5px solid #fff' }} /> Sélectionnée
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> A des signalements
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> +3 signalements
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#475569' }} /> Vide
        </span>
      </div>
    </div>
  );
}
