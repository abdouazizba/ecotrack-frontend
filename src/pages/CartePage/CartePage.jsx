import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getContainers, getZones, getSignalements, getCapteurs } from '../../services/api';
import { enrichContainersWithSensors } from '../../services/transformers';
import { Map, RefreshCw, Layers, Package, AlertTriangle, MapPin, Info } from 'lucide-react';

// ── FitBounds helper ─────────────────────────────────────────────────────────
function FitBoundsHelper({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

// ── Color helpers ────────────────────────────────────────────────────────────
const getContainerColor = (fillLevel) => {
  if (fillLevel == null) return '#6b7280';
  if (fillLevel > 80) return '#ef4444';
  if (fillLevel >= 50) return '#f59e0b';
  return '#10b981';
};

const getSignalementColor = (status) => {
  if (status === 'in_progress') return '#3b82f6';
  if (status === 'closed') return '#10b981';
  return '#f59e0b'; // pending / default
};

const getSignalementLabel = (status) => {
  if (status === 'in_progress') return 'En cours';
  if (status === 'closed') return 'Fermé';
  if (status === 'rejected') return 'Rejeté';
  return 'En attente';
};

const getTypeLabel = (type) => {
  const labels = {
    overflowing: 'Débordement',
    full: 'Conteneur plein',
    damaged: 'Conteneur endommagé',
    smell: 'Mauvaise odeur',
    other: 'Autre',
  };
  return labels[type] || type || 'Autre';
};

const ZONE_COLORS = ['#2dd4bf', '#0d9488', '#10b981', '#059669', '#0891b2', '#7c3aed', '#8b5cf6', '#06b6d4'];

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    background: '#0f1419',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 18px',
    background: '#1e2433',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: 700,
    marginRight: 8,
    whiteSpace: 'nowrap',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.06)',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  chipValue: {
    color: '#e2e8f0',
    fontWeight: 700,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginLeft: 'auto',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  // Layer panel
  layerPanel: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
    background: 'rgba(30,36,51,0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid rgba(255,255,255,0.08)',
    minWidth: 180,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  layerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  layerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 0',
    cursor: 'pointer',
    color: '#cbd5e1',
    fontSize: 13,
  },
  layerCheckbox: {
    accentColor: '#0d9488',
    cursor: 'pointer',
    width: 15,
    height: 15,
  },
  layerBadge: {
    marginLeft: 'auto',
    background: 'rgba(255,255,255,0.08)',
    color: '#94a3b8',
    padding: '1px 7px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  },
  // Legend
  legend: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    zIndex: 1000,
    background: 'rgba(30,36,51,0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  legendTitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  legendSection: {
    marginBottom: 8,
  },
  legendSectionTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 3,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#cbd5e1',
    fontSize: 11,
    padding: '1px 0',
  },
  legendDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.2)',
  }),
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15,20,25,0.7)',
    zIndex: 1100,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 600,
  },
  popupTitle: {
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 4,
    color: '#1e293b',
  },
  popupRow: {
    fontSize: 12,
    color: '#475569',
    margin: '2px 0',
  },
  popupBadge: (bg) => ({
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: bg,
    marginLeft: 4,
  }),
};

// ── Main component ───────────────────────────────────────────────────────────
export default function CartePage() {
  const [containers, setContainers] = useState([]);
  const [zones, setZones] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Layer visibility
  const [showContainers, setShowContainers] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showSignalements, setShowSignalements] = useState(true);

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [containersData, zonesData, signalementsData, capteursData] = await Promise.all([
        getContainers(),
        getZones(),
        getSignalements(),
        getCapteurs(),
      ]);

      const enriched = enrichContainersWithSensors(containersData, capteursData);
      setContainers(enriched);
      setZones(zonesData);
      setSignalements(signalementsData);
    } catch (err) {
      console.error('CartePage: Error loading data', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const validContainers = useMemo(
    () => containers.filter((c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)),
    [containers]
  );

  const validSignalements = useMemo(
    () => signalements.filter((s) => s.latitude && s.longitude && (s.latitude !== 0 || s.longitude !== 0)),
    [signalements]
  );

  const openSignalements = useMemo(
    () => signalements.filter((s) => s.status === 'pending' || s.status === 'in_progress'),
    [signalements]
  );

  const averageFill = useMemo(() => {
    const withFill = containers.filter((c) => c.fillLevel != null);
    if (withFill.length === 0) return 0;
    return Math.round(withFill.reduce((sum, c) => sum + c.fillLevel, 0) / withFill.length);
  }, [containers]);

  // ── Bounds ───────────────────────────────────────────────────────────────
  const bounds = useMemo(() => {
    const b = L.latLngBounds([]);

    if (showContainers) {
      validContainers.forEach((c) => b.extend([c.latitude, c.longitude]));
    }
    if (showSignalements) {
      validSignalements.forEach((s) => b.extend([s.latitude, s.longitude]));
    }
    if (showZones) {
      zones.forEach((z) => {
        if (z.geometrie) {
          try {
            const geoLayer = L.geoJSON(z.geometrie);
            const zBounds = geoLayer.getBounds();
            if (zBounds.isValid()) b.extend(zBounds);
          } catch { /* skip invalid geojson */ }
        } else if (z.latitude && z.longitude) {
          b.extend([z.latitude, z.longitude]);
        }
      });
    }

    return b;
  }, [validContainers, validSignalements, zones, showContainers, showSignalements, showZones]);

  // ── Zone rendering ───────────────────────────────────────────────────────
  const zoneElements = useMemo(() => {
    if (!showZones) return null;
    return zones.map((zone, idx) => {
      const color = ZONE_COLORS[idx % ZONE_COLORS.length];
      const pathOpts = { color, fillColor: color, fillOpacity: 0.15, weight: 2 };

      if (zone.geometrie?.properties?.subType === 'Circle') {
        const [lng, lat] = zone.geometrie.geometry.coordinates;
        return (
          <Circle
            key={`zone-circle-${zone.id}`}
            center={[lat, lng]}
            radius={zone.geometrie.properties.radius}
            pathOptions={pathOpts}
          >
            <Popup>
              <div style={styles.popupTitle}>{zone.nom || zone.code_zone}</div>
              <div style={styles.popupRow}>Code: {zone.code_zone || '--'}</div>
              <div style={styles.popupRow}>Population: {zone.population_estimee?.toLocaleString() || '--'}</div>
            </Popup>
          </Circle>
        );
      }

      if (zone.geometrie) {
        return (
          <GeoJSON
            key={`zone-geo-${zone.id}-${idx}`}
            data={zone.geometrie}
            style={pathOpts}
            onEachFeature={(_feature, layer) => {
              layer.bindPopup(
                `<div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1e293b">${zone.nom || zone.code_zone}</div>
                 <div style="font-size:12px;color:#475569">Code: ${zone.code_zone || '--'}</div>
                 <div style="font-size:12px;color:#475569">Population: ${zone.population_estimee?.toLocaleString() || '--'}</div>`
              );
            }}
          />
        );
      }

      if (zone.latitude && zone.longitude) {
        return (
          <Circle
            key={`zone-latlng-${zone.id}`}
            center={[zone.latitude, zone.longitude]}
            radius={600}
            pathOptions={{ ...pathOpts, dashArray: '6 4' }}
          >
            <Popup>
              <div style={styles.popupTitle}>{zone.nom || zone.code_zone}</div>
              <div style={styles.popupRow}>Code: {zone.code_zone || '--'}</div>
              <div style={styles.popupRow}>Population: {zone.population_estimee?.toLocaleString() || '--'}</div>
            </Popup>
          </Circle>
        );
      }

      return null;
    });
  }, [zones, showZones]);

  // ── Build zone lookup for container popups ─────────────────────────────
  const zoneMap = useMemo(() => {
    const m = {};
    zones.forEach((z) => { m[z.id] = z.nom || z.code_zone || '--'; });
    return m;
  }, [zones]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      {/* ── TOOLBAR ── */}
      <div style={styles.toolbar}>
        <div style={styles.title}>
          <Map size={18} style={{ color: '#0d9488' }} />
          <span>Carte Globale</span>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.chip}>
            <Package size={13} style={{ color: '#10b981' }} />
            <span>Conteneurs</span>
            <span style={styles.chipValue}>{containers.length}</span>
          </div>
          <div style={styles.chip}>
            <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
            <span>Signalements ouverts</span>
            <span style={styles.chipValue}>{openSignalements.length}</span>
          </div>
          <div style={styles.chip}>
            <MapPin size={13} style={{ color: '#0d9488' }} />
            <span>Zones</span>
            <span style={styles.chipValue}>{zones.length}</span>
          </div>
          <div style={styles.chip}>
            <Info size={13} style={{ color: '#3b82f6' }} />
            <span>Remplissage moyen</span>
            <span style={styles.chipValue}>{averageFill}%</span>
          </div>
        </div>

        <button
          style={{
            ...styles.refreshBtn,
            ...(refreshing ? { opacity: 0.6, pointerEvents: 'none' } : {}),
          }}
          onClick={() => loadData(true)}
          title="Actualiser les données"
        >
          <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {/* ── MAP AREA ── */}
      <div style={styles.mapContainer}>
        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 36,
                height: 36,
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#0d9488',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 10px',
              }} />
              Chargement de la carte...
            </div>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {bounds && bounds.isValid() && <FitBoundsHelper bounds={bounds} />}

          {/* ── Zones ── */}
          {zoneElements}

          {/* ── Containers ── */}
          {showContainers && validContainers.map((c) => {
            const fillColor = getContainerColor(c.fillLevel);
            const fillDisplay = c.fillLevel != null ? `${Math.round(c.fillLevel)}%` : 'N/A';
            return (
              <CircleMarker
                key={`cont-${c.id}`}
                center={[c.latitude, c.longitude]}
                radius={8}
                pathOptions={{
                  fillColor,
                  color: '#fff',
                  weight: 2,
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div style={styles.popupTitle}>
                    {c.code_conteneur || c.name || 'Conteneur'}
                  </div>
                  <div style={styles.popupRow}>
                    Remplissage: <strong>{fillDisplay}</strong>
                    <span style={styles.popupBadge(fillColor)}>{fillDisplay}</span>
                  </div>
                  <div style={styles.popupRow}>
                    Zone: {zoneMap[c.zoneId] || c.zoneId || '--'}
                  </div>
                  <div style={styles.popupRow}>
                    Statut: {c.status || '--'}
                  </div>
                  <div style={styles.popupRow}>
                    Type: {c.type || 'standard'}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* ── Signalements ── */}
          {showSignalements && validSignalements.map((s) => {
            const color = getSignalementColor(s.status);
            return (
              <CircleMarker
                key={`sig-${s.id}`}
                center={[s.latitude, s.longitude]}
                radius={6}
                pathOptions={{
                  fillColor: color,
                  color: '#fff',
                  weight: 2,
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div style={styles.popupTitle}>
                    Signalement
                    <span style={styles.popupBadge(color)}>{getSignalementLabel(s.status)}</span>
                  </div>
                  <div style={styles.popupRow}>
                    Type: {getTypeLabel(s.type)}
                  </div>
                  {s.description && (
                    <div style={{ ...styles.popupRow, maxWidth: 220, wordBreak: 'break-word' }}>
                      {s.description.length > 100 ? s.description.slice(0, 100) + '...' : s.description}
                    </div>
                  )}
                  <div style={styles.popupRow}>
                    Date: {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '--'}
                  </div>
                  {s.priority && (
                    <div style={styles.popupRow}>
                      Priorité: {s.priority}
                    </div>
                  )}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* ── LAYER TOGGLE PANEL ── */}
        <div style={styles.layerPanel}>
          <div style={styles.layerTitle}>
            <Layers size={13} />
            <span>Couches</span>
          </div>

          <label style={styles.layerRow}>
            <input
              type="checkbox"
              checked={showContainers}
              onChange={(e) => setShowContainers(e.target.checked)}
              style={styles.layerCheckbox}
            />
            <Package size={14} style={{ color: '#10b981' }} />
            <span>Conteneurs</span>
            <span style={styles.layerBadge}>{validContainers.length}</span>
          </label>

          <label style={styles.layerRow}>
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              style={styles.layerCheckbox}
            />
            <MapPin size={14} style={{ color: '#0d9488' }} />
            <span>Zones</span>
            <span style={styles.layerBadge}>{zones.length}</span>
          </label>

          <label style={styles.layerRow}>
            <input
              type="checkbox"
              checked={showSignalements}
              onChange={(e) => setShowSignalements(e.target.checked)}
              style={styles.layerCheckbox}
            />
            <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
            <span>Signalements</span>
            <span style={styles.layerBadge}>{validSignalements.length}</span>
          </label>
        </div>

        {/* ── LEGEND ── */}
        <div style={styles.legend}>
          <div style={styles.legendTitle}>Légende</div>

          <div style={styles.legendSection}>
            <div style={styles.legendSectionTitle}>Conteneurs (remplissage)</div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#10b981')} />
              <span>&lt; 50%</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#f59e0b')} />
              <span>50% - 80%</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#ef4444')} />
              <span>&gt; 80%</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#6b7280')} />
              <span>Inconnu</span>
            </div>
          </div>

          <div style={styles.legendSection}>
            <div style={styles.legendSectionTitle}>Signalements (statut)</div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#f59e0b')} />
              <span>En attente</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#3b82f6')} />
              <span>En cours</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#10b981')} />
              <span>Fermé</span>
            </div>
          </div>

          <div style={{ ...styles.legendSection, marginBottom: 0 }}>
            <div style={styles.legendSectionTitle}>Zones</div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot('#0d9488'), opacity: 0.5 }} />
              <span>Polygone / cercle</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global keyframe for spinner animation ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
