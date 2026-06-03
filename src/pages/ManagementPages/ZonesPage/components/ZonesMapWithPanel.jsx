import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { getZones, getZone, createZone, updateZone, deleteZone, getContainers, getCapteurs } from '../../../../services/api';
import { enrichContainersWithSensors } from '../../../../services/transformers';
import './ZonesMapWithPanel.css';
import {
  Edit2, Trash2, X, MapPin, Users, Package,
  Cloud, Wind, Droplets, Thermometer,
  ChevronRight, ChevronLeft, ArrowLeft, Plus,
} from 'lucide-react';

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

if (L.drawLocal) {
  L.drawLocal.draw.toolbar.buttons.polygon   = 'Polygone';
  L.drawLocal.draw.toolbar.buttons.rectangle = 'Rectangle';
  L.drawLocal.draw.toolbar.buttons.circle    = 'Cercle';
  L.drawLocal.draw.toolbar.actions.text      = 'Annuler';
  L.drawLocal.draw.toolbar.finish.text       = 'Terminer';
  L.drawLocal.draw.toolbar.undo.text         = 'Supprimer dernier point';
  L.drawLocal.draw.handlers.polygon.tooltip  = {
    start: 'Cliquez pour commencer à dessiner.',
    cont:  'Cliquez pour continuer.',
    end:   'Cliquez sur le premier point pour fermer.',
  };
  L.drawLocal.draw.handlers.rectangle.tooltip = { start: 'Cliquez et glissez pour dessiner.' };
  L.drawLocal.draw.handlers.circle.tooltip    = { start: 'Cliquez et glissez pour dessiner.' };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ZONE_COLORS = ['#2dd4bf', '#0d9488', '#10b981', '#059669', '#0891b2', '#7c3aed'];
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const EMPTY_FORM = { nom: '', code_zone: '', population_estimee: '', latitude: '', longitude: '', is_active: true };

// ── Icon helpers ──────────────────────────────────────────────────────────────
const createZoneIcon = (color, label = '') =>
  L.divIcon({
    html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:800;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);text-align:center;overflow:hidden;padding:2px;">
      <span style="font-size:13px;line-height:1;">📍</span>
      <span style="font-size:8px;opacity:.9;max-width:34px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</span>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

const createContainerIcon = (status = 'actif') =>
  L.divIcon({
    html: `<div style="background:${status === 'actif' ? '#10b981' : '#ef4444'};width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);">📦</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

// ── DrawControl ───────────────────────────────────────────────────────────────
function DrawControl({ onCreated, drawnItemsRef }) {
  const map = useMap();
  const cbRef = useRef(onCreated);
  cbRef.current = onCreated;

  useEffect(() => {
    const fg = new L.FeatureGroup();
    drawnItemsRef.current = fg;
    map.addLayer(fg);

    const control = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon:      { shapeOptions: { color: '#2dd4bf', fillOpacity: 0.18, weight: 2 }, showArea: true, allowIntersection: false },
        rectangle:    { shapeOptions: { color: '#2dd4bf', fillOpacity: 0.18, weight: 2 } },
        circle:       { shapeOptions: { color: '#2dd4bf', fillOpacity: 0.18, weight: 2 } },
        polyline:     false,
        marker:       false,
        circlemarker: false,
      },
      edit: { featureGroup: fg },
    });
    map.addControl(control);

    const handleCreated = (e) => {
      const { layer, layerType } = e;
      fg.clearLayers();
      fg.addLayer(layer);
      let center, geojson;
      if (layerType === 'circle') {
        center = layer.getLatLng();
        geojson = { type: 'Feature', geometry: { type: 'Point', coordinates: [center.lng, center.lat] }, properties: { subType: 'Circle', radius: layer.getRadius() } };
      } else {
        const bounds = layer.getBounds?.();
        center = bounds ? bounds.getCenter() : layer.getCenter?.();
        geojson = layer.toGeoJSON();
      }
      cbRef.current({ center, geojson, layerType });
    };

    map.on('draw:created', handleCreated);
    return () => {
      map.off('draw:created', handleCreated);
      map.removeControl(control);
      map.removeLayer(fg);
      drawnItemsRef.current = null;
    };
  }, [map, drawnItemsRef]);

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ZonesMapWithPanel() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [zones, setZones]           = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [panelOpen, setPanelOpen]   = useState(true);
  const [panelView, setPanelView]   = useState('list'); // 'list' | 'detail' | 'form'

  const [selectedZone, setSelectedZone] = useState(null);
  const [weather, setWeather]           = useState(null);

  const [editingId, setEditingId]   = useState(null);
  const [drawnShape, setDrawnShape] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const drawnItemsRef = useRef(null);

  // ── Callbacks (déclarés AVANT les useEffect qui les consomment) ────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [zonesData, containersData, capteursData] = await Promise.all([getZones(), getContainers(), getCapteurs()]);
      setZones(zonesData);
      setContainers(enrichContainersWithSensors(containersData, capteursData));
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeather = useCallback(async (lat, lon) => {
    if (!WEATHER_API_KEY) return;
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
      );
      if (res.ok) setWeather(await res.json());
    } catch { /* non-critique */ }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setDrawnShape(null);
    setEditingId(null);
    if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedZone?.latitude && selectedZone?.longitude) {
      loadWeather(selectedZone.latitude, selectedZone.longitude);
    }
  }, [selectedZone, loadWeather]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const containersByZone = useMemo(() => {
    const acc = {};
    containers.forEach(c => {
      const zid = c.zoneId || c.zone_id;
      if (zid) acc[zid] = (acc[zid] || 0) + 1;
    });
    return acc;
  }, [containers]);

  const selectedZoneContainers = useMemo(
    () => containers.filter(c => (c.zoneId || c.zone_id) === selectedZone?.id),
    [containers, selectedZone]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleZoneClick = useCallback(async (zoneId) => {
    if (panelView === 'form') return;
    try {
      const details = await getZone(zoneId);
      setSelectedZone(details || zones.find(z => z.id === zoneId));
      setWeather(null);
      setPanelView('detail');
      setPanelOpen(true);
    } catch {
      const fallback = zones.find(z => z.id === zoneId);
      if (fallback) { setSelectedZone(fallback); setPanelView('detail'); setPanelOpen(true); }
    }
  }, [zones, panelView]);

  const handleShapeCreated = useCallback(({ center, geojson }) => {
    setDrawnShape({ center, geojson });
    setFormData(f => ({ ...f, latitude: center.lat.toFixed(6), longitude: center.lng.toFixed(6) }));
    setEditingId(null);
    setPanelView('form');
    setPanelOpen(true);
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setEditingId(null);
    setPanelView('form');
  }, [resetForm]);

  const handleEdit = useCallback((zone) => {
    setEditingId(zone.id);
    setFormData({
      nom:                zone.nom || '',
      code_zone:          zone.code_zone || '',
      population_estimee: zone.population_estimee || '',
      latitude:           zone.latitude ? String(zone.latitude) : '',
      longitude:          zone.longitude ? String(zone.longitude) : '',
      is_active:          zone.is_active ?? true,
    });
    setDrawnShape(null);
    setPanelView('form');
  }, []);

  const handleCancelForm = useCallback(() => {
    const backTo = editingId ? 'detail' : 'list';
    setPanelView(backTo);
    resetForm();
  }, [editingId, resetForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = { ...formData };
      if (drawnShape) {
        data.latitude  = drawnShape.center.lat;
        data.longitude = drawnShape.center.lng;
        data.geometrie = drawnShape.geojson;
      }
      if (editingId) await updateZone(editingId, data);
      else           await createZone(data);
      await loadData();
      const backTo = editingId ? 'detail' : 'list';
      if (editingId) {
        // refresh selected zone
        try {
          const updated = await getZone(editingId);
          setSelectedZone(updated);
        } catch { /* ignore */ }
      }
      setPanelView(backTo);
      resetForm();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [editingId, formData, drawnShape, loadData, resetForm]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Supprimer cette zone ?')) return;
    try {
      await deleteZone(id);
      await loadData();
      setPanelView('list');
      setSelectedZone(null);
    } catch {
      setError('Erreur lors de la suppression');
    }
  }, [loadData]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="zones-page zones-page--loading">
        <div className="zones-spinner-wrap">
          <div className="spinner" />
          <p>Chargement des zones…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zones-page">

      {/* ── CARTE ── */}
      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={12}
        className="zones-map"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <DrawControl onCreated={handleShapeCreated} drawnItemsRef={drawnItemsRef} />

        {zones.map((zone, idx) => {
          const color    = ZONE_COLORS[idx % ZONE_COLORS.length];
          const isSel    = selectedZone?.id === zone.id;
          const pathOpts = { color, fillColor: color, fillOpacity: isSel ? 0.38 : 0.15, weight: isSel ? 3 : 2 };

          if (zone.geometrie?.properties?.subType === 'Circle') {
            const [lng, lat] = zone.geometrie.geometry.coordinates;
            return <Circle key={zone.id} center={[lat, lng]} radius={zone.geometrie.properties.radius} pathOptions={pathOpts} eventHandlers={{ click: () => handleZoneClick(zone.id) }} />;
          }
          if (zone.geometrie) {
            return <GeoJSON key={`${zone.id}-${isSel}`} data={zone.geometrie} style={pathOpts} eventHandlers={{ click: () => handleZoneClick(zone.id) }} />;
          }
          if (zone.latitude && zone.longitude) {
            return (
              <React.Fragment key={zone.id}>
                <Circle center={[zone.latitude, zone.longitude]} radius={600} pathOptions={{ ...pathOpts, dashArray: isSel ? null : '6 4' }} eventHandlers={{ click: () => handleZoneClick(zone.id) }} />
                <Marker position={[zone.latitude, zone.longitude]} icon={createZoneIcon(color, zone.code_zone || zone.nom?.slice(0, 4))} eventHandlers={{ click: () => handleZoneClick(zone.id) }} />
              </React.Fragment>
            );
          }
          return null;
        })}

        {selectedZoneContainers.length > 0 && (
          <MarkerClusterGroup>
            {selectedZoneContainers.map(c => (
              <Marker key={c.id} position={[c.latitude || 48.8566, c.longitude || 2.3522]} icon={createContainerIcon(c.status)} />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* ── PANEL FLOTTANT ── */}
      <aside className={`zones-panel ${panelOpen ? 'open' : 'collapsed'}`}>
        <button className="panel-toggle" onClick={() => setPanelOpen(v => !v)} title={panelOpen ? 'Réduire' : 'Ouvrir'}>
          {panelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="panel-inner">
          {error && (
            <div className="panel-error">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {/* ── LIST ── */}
          {panelView === 'list' && (
            <>
              <div className="panel-header">
                <div className="ph-title">
                  <MapPin size={16} style={{ color: '#0d9488', flexShrink: 0 }} />
                  <span>Zones</span>
                  <span className="ph-badge">{zones.length}</span>
                </div>
                <button className="ph-btn-new" onClick={handleOpenCreate} title="Nouvelle zone">
                  <Plus size={15} />
                </button>
              </div>

              <div className="panel-scroll">
                {zones.map((zone, idx) => (
                  <button
                    key={zone.id}
                    className={`zone-item ${selectedZone?.id === zone.id ? 'selected' : ''}`}
                    onClick={() => handleZoneClick(zone.id)}
                  >
                    <div className="zi-accent" style={{ background: ZONE_COLORS[idx % ZONE_COLORS.length] }} />
                    <div className="zi-body">
                      <p className="zi-name">{zone.nom}</p>
                      <p className="zi-code">{zone.code_zone || '—'}</p>
                      <div className="zi-stats">
                        <span><Users size={11} /> {zone.population_estimee?.toLocaleString() || '?'}</span>
                        <span><Package size={11} /> {containersByZone[zone.id] || 0}</span>
                      </div>
                    </div>
                    <div className="zi-right">
                      <div className={`status-dot ${zone.is_active ? 'active' : ''}`} />
                      <ChevronRight size={14} className="zi-arrow" />
                    </div>
                  </button>
                ))}

                {zones.length === 0 && (
                  <div className="panel-empty">
                    <MapPin size={32} strokeWidth={1.2} style={{ color: '#d1d5db' }} />
                    <p className="pe-title">Aucune zone</p>
                    <p className="pe-hint">Dessinez une zone sur la carte ou cliquez sur "+" pour en créer une.</p>
                  </div>
                )}

                <div className="draw-hint-bar">
                  <span>🖊️</span>
                  <span>Dessinez directement sur la carte avec la barre d'outils en haut à gauche</span>
                </div>
              </div>
            </>
          )}

          {/* ── DETAIL ── */}
          {panelView === 'detail' && selectedZone && (
            <>
              <div className="panel-header">
                <button className="ph-back" onClick={() => { setPanelView('list'); setSelectedZone(null); setWeather(null); }}>
                  <ArrowLeft size={16} />
                </button>
                <div className="ph-title ph-title--detail">
                  <div>
                    <span className="ph-name">{selectedZone.nom}</span>
                    {selectedZone.code_zone && <span className="ph-code">{selectedZone.code_zone}</span>}
                  </div>
                </div>
                <span className={`ph-status ${selectedZone.is_active ? 'active' : 'inactive'}`}>
                  {selectedZone.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="panel-scroll">
                {weather && (
                  <div className="detail-weather">
                    <div className="dw-temp"><Thermometer size={16} /><span>{Math.round(weather.main?.temp ?? 0)}°C</span></div>
                    <div className="dw-stat"><Cloud size={13} /><span>{weather.weather?.[0]?.description ?? '—'}</span></div>
                    <div className="dw-stat"><Wind size={13} /><span>{Math.round(weather.wind?.speed ?? 0)} m/s</span></div>
                    <div className="dw-stat"><Droplets size={13} /><span>{weather.main?.humidity ?? 0}%</span></div>
                  </div>
                )}

                <div className="detail-grid">
                  <div className="detail-card">
                    <Users size={16} className="dc-icon" />
                    <span className="dc-val">{selectedZone.population_estimee?.toLocaleString() ?? '—'}</span>
                    <span className="dc-label">Habitants</span>
                  </div>
                  <div className="detail-card">
                    <Package size={16} className="dc-icon" />
                    <span className="dc-val">{selectedZoneContainers.length}</span>
                    <span className="dc-label">Conteneurs</span>
                  </div>
                  {(selectedZone.latitude !== 0 || selectedZone.longitude !== 0) && (
                    <div className="detail-card detail-card--wide">
                      <MapPin size={16} className="dc-icon" />
                      <span className="dc-val">{selectedZone.latitude?.toFixed(4)}, {selectedZone.longitude?.toFixed(4)}</span>
                      <span className="dc-label">Coordonnées</span>
                    </div>
                  )}
                </div>

                {selectedZoneContainers.length > 0 && (
                  <div className="detail-section">
                    <p className="ds-title">Conteneurs ({selectedZoneContainers.length})</p>
                    {selectedZoneContainers.map(c => (
                      <div key={c.id} className="cont-row">
                        <span className="cr-code">{c.code_conteneur || 'Conteneur'}</span>
                        <span className="cr-type">{c.type || 'Standard'}</span>
                        <span className="cr-status">{c.status === 'actif' ? '🟢' : '🔴'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel-footer">
                <button className="pf-btn pf-btn--delete" onClick={() => handleDelete(selectedZone.id)}>
                  <Trash2 size={14} /> Supprimer
                </button>
                <button className="pf-btn pf-btn--edit" onClick={() => handleEdit(selectedZone)}>
                  <Edit2 size={14} /> Modifier
                </button>
              </div>
            </>
          )}

          {/* ── FORM ── */}
          {panelView === 'form' && (
            <>
              <div className="panel-header">
                <button className="ph-back" onClick={handleCancelForm}><ArrowLeft size={16} /></button>
                <div className="ph-title">
                  <span>{editingId ? '✏️' : '➕'}</span>
                  <span>{editingId ? 'Modifier la zone' : 'Nouvelle zone'}</span>
                </div>
              </div>

              <div className="panel-scroll">
                {!editingId && !drawnShape && (
                  <div className="form-draw-hint">
                    🖊️ Dessinez la zone sur la carte <em>ou</em> saisissez les coordonnées ci-dessous.
                  </div>
                )}
                {drawnShape && <div className="form-draw-ok">✅ Zone dessinée — complétez les informations</div>}
                {editingId && !drawnShape && (
                  <div className="form-draw-hint">
                    📍 Redessinez sur la carte pour changer la géographie (optionnel).
                  </div>
                )}

                <form onSubmit={handleSubmit} id="zone-form" className="zone-form">
                  <div className="form-group">
                    <label>Nom de la zone *</label>
                    <input type="text" required autoFocus placeholder="Ex : Zone Nord"
                      value={formData.nom}
                      onChange={e => setFormData(d => ({ ...d, nom: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code zone</label>
                    <input type="text" placeholder="Ex : ZN-001"
                      value={formData.code_zone}
                      onChange={e => setFormData(d => ({ ...d, code_zone: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input type="number" step="any" placeholder="14.6937"
                        value={formData.latitude}
                        onChange={e => setFormData(d => ({ ...d, latitude: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitude</label>
                      <input type="number" step="any" placeholder="-17.4441"
                        value={formData.longitude}
                        onChange={e => setFormData(d => ({ ...d, longitude: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Population estimée</label>
                    <input type="number" min="0" placeholder="0"
                      value={formData.population_estimee}
                      onChange={e => setFormData(d => ({ ...d, population_estimee: parseInt(e.target.value) || '' }))}
                    />
                  </div>
                  <div className="form-group form-group--checkbox">
                    <label>
                      <input type="checkbox"
                        checked={formData.is_active}
                        onChange={e => setFormData(d => ({ ...d, is_active: e.target.checked }))}
                      />
                      <span>Zone active</span>
                    </label>
                  </div>
                </form>
              </div>

              <div className="panel-footer">
                <button type="button" className="pf-btn pf-btn--cancel" onClick={handleCancelForm}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" form="zone-form" className="pf-btn pf-btn--save" disabled={saving}>
                  {saving ? '…' : editingId ? '💾 Enregistrer' : '➕ Créer'}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
