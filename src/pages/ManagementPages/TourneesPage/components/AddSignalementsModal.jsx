import React, { useState, useMemo } from 'react';
import { X, CheckCircle, List, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TYPE_LABELS, PRIORITY_META } from '../utils/constants';

function FitBounds({ points }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    else if (points.length === 1) map.setView(points[0], 14);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const PRIO_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };

export default function AddSignalementsModal({
  show, allSigs, tournees = [], currentTourneeId, onClose, onSubmit,
}) {
  const [picked, setPicked] = useState([]);
  const [view, setView] = useState('map');

  const assignedMap = useMemo(() => {
    const map = {};
    tournees.forEach((t) => {
      if (String(t.id) === String(currentTourneeId)) return;
      (t.signalements || []).forEach((s) => { map[s.id] = t.titre || t.code; });
    });
    return map;
  }, [tournees, currentTourneeId]);

  if (!show) return null;

  const toggle = (id) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = () => { onSubmit(picked); setPicked([]); };
  const handleClose = () => { setPicked([]); onClose(); };

  const available = (allSigs || []).filter((s) => !assignedMap[s.id]);
  const withCoords = available.filter((s) => s.latitude != null && s.longitude != null);
  const points = withCoords.map((s) => [s.latitude, s.longitude]);
  const center = points.length ? points[0] : [48.8566, 2.3522];

  return (
    <div className="t-overlay" onClick={handleClose}>
      <div className="t-modal t-modal--wide" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3>Ajouter des signalements</h3>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', marginRight: 12 }}>
            <button onClick={() => setView('map')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: view === 'map' ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: view === 'map' ? '#fff' : '#64748b' }}>
              <MapIcon size={12} /> Carte
            </button>
            <button onClick={() => setView('list')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: view === 'list' ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: view === 'list' ? '#fff' : '#64748b' }}>
              <List size={12} /> Liste
            </button>
          </div>
          <button className="t-modal-close" onClick={handleClose} aria-label="Fermer"><X size={18} /></button>
        </div>

        <p style={{ padding: '0 16px', margin: '0 0 8px', color: '#64748b', fontSize: '0.82rem' }}>
          {available.length} disponible{available.length !== 1 ? 's' : ''}
          {picked.length > 0 && <span style={{ color: '#10b981', fontWeight: 700 }}> · {picked.length} sélectionné{picked.length > 1 ? 's' : ''}</span>}
        </p>

        {view === 'map' && (
          <div style={{ padding: '0 16px' }}>
            <style>{`
              .add-sig-map .leaflet-popup-content-wrapper { background: #1e2433 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
              .add-sig-map .leaflet-popup-tip { background: #1e2433 !important; }
              .add-sig-map .leaflet-popup-content { margin: 10px 12px !important; }
              .add-sig-map .leaflet-popup-close-button { color: #64748b !important; }
            `}</style>
            <MapContainer center={center} zoom={12} className="add-sig-map" style={{ height: 360, width: '100%', borderRadius: 10, overflow: 'hidden' }} scrollWheelZoom={true}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
              {points.length > 0 && <FitBounds points={points} />}
              {withCoords.map((s) => {
                const selected = picked.includes(s.id);
                const color = selected ? '#10b981' : (PRIO_COLORS[s.priority] || '#3b82f6');
                return (
                  <CircleMarker
                    key={s.id}
                    center={[s.latitude, s.longitude]}
                    radius={selected ? 11 : 8}
                    pathOptions={{ fillColor: color, fillOpacity: selected ? 0.95 : 0.7, color: selected ? '#fff' : 'transparent', weight: selected ? 2 : 0 }}
                    eventHandlers={{ click: () => toggle(s.id) }}
                  >
                    <Popup>
                      <div style={{ color: '#e2e8f0', minWidth: 180 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 4px' }}>
                          {TYPE_LABELS[s.type] || s.type}
                        </p>
                        {s.description && <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 8px' }}>{s.description.slice(0, 80)}</p>}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: `${PRIO_COLORS[s.priority] || '#3b82f6'}22`, color: PRIO_COLORS[s.priority] || '#3b82f6' }}>
                            {(PRIORITY_META[s.priority] || {}).label || s.priority}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                          style={{ width: '100%', padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: selected ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selected ? '#ef4444' : '#10b981' }}
                        >
                          {selected ? '✕ Retirer' : '+ Ajouter'}
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1.5px solid #fff' }} /> Sélectionné</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Critique</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} /> Haute</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Normale</span>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="t-sig-pick-list">
            {available.length === 0 && <p className="tl-empty">Aucun signalement ouvert</p>}
            {available.map((sig) => {
              const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
              const selected = picked.includes(sig.id);
              return (
                <label key={sig.id} className={`t-sig-pick-item ${selected ? 'checked' : ''}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggle(sig.id)} />
                  <div className="tspi-info">
                    <span className="sig-type">{TYPE_LABELS[sig.type] || sig.type}</span>
                    <span className="t-badge" style={{ color: priority.color, background: `${priority.color}18` }}>
                      {priority.label}
                    </span>
                    {sig.description && <span className="tspi-desc">{sig.description}</span>}
                  </div>
                  {selected && <CheckCircle size={16} color="#10b981" />}
                </label>
              );
            })}
          </div>
        )}

        <div className="t-modal-footer">
          <button type="button" className="t-btn-cancel" onClick={handleClose}>Annuler</button>
          <button type="button" className="t-btn-confirm" disabled={picked.length === 0} onClick={handleSubmit}>
            Ajouter ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}
