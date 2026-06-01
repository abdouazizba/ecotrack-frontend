import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { getZones, getZone, createZone, updateZone, deleteZone, getContainers } from '../../../../services/api';
import './ZonesMapWithPanel.css';
import { Plus, Edit2, Trash2, X, MapPin, Users, Package, Cloud, Wind, Droplets } from 'lucide-react';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const COLORS = ['#2dd4bf', '#0d9488', '#10b981', '#059669'];
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'b1e09e3b26a0e029e3c19c0e78ab2c5d';

// Conteneur icon
const createContainerIcon = (status = 'active') => {
  const color = status === 'active' ? '#10b981' : '#ef4444';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📦</div>`,
    className: 'container-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export default function ZonesMapWithPanel() {
  const [zones, setZones] = useState([]);
  const [containers, setContainers] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [selectedZoneDetails, setSelectedZoneDetails] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    code_zone: '',
    population_estimee: '',
    is_active: true,
  });
  const mapRef = useRef(null);

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  // Charger la météo quand une zone est sélectionnée
  useEffect(() => {
    if (selectedZoneDetails?.latitude && selectedZoneDetails?.longitude) {
      loadWeather(selectedZoneDetails.latitude, selectedZoneDetails.longitude);
    }
  }, [selectedZoneDetails?.latitude, selectedZoneDetails?.longitude]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [zonesData, containersData] = await Promise.all([
        getZones(),
        getContainers(),
      ]);
      setZones(zonesData);
      setContainers(containersData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeather = useCallback(async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
      );
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (err) {
      // Silencieux - la météo n'est pas critique
    }
  }, []);

  const handleSelectZone = useCallback(async (zoneId) => {
    try {
      setSelectedZoneId(zoneId);
      const details = await getZone(zoneId);
      if (!details || !details.id) throw new Error('Données invalides');
      setSelectedZoneDetails(details);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError('Erreur lors du chargement de la zone');
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateZone(editingId, formData);
      } else {
        await createZone(formData);
      }
      await loadData();
      setShowForm(false);
      setFormData({ nom: '', code_zone: '', population_estimee: '', is_active: true });
      setEditingId(null);
      setSelectedZoneId(null);
      setSelectedZoneDetails(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  }, [editingId, formData, loadData]);

  const handleEdit = useCallback((zone) => {
    setEditingId(zone.id);
    setFormData({
      nom: zone.nom || '',
      code_zone: zone.code_zone || '',
      population_estimee: zone.population_estimee || '',
      is_active: zone.is_active ?? true,
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      try {
        await deleteZone(id);
        await loadData();
        setSelectedZoneId(null);
        setSelectedZoneDetails(null);
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  }, [loadData]);

  const handleClosePanel = useCallback(() => {
    setSelectedZoneId(null);
    setSelectedZoneDetails(null);
    setShowForm(false);
    setEditingId(null);
    setFormData({ nom: '', code_zone: '', population_estimee: '', is_active: true });
    setWeather(null);
  }, []);

  // Compter les conteneurs par zone (mémorisé)
  const containersByZone = useMemo(() => {
    const map = {};
    containers.forEach(c => {
      const zoneId = c.zoneId || c.zone_id;
      if (zoneId) {
        map[zoneId] = (map[zoneId] || 0) + 1;
      }
    });
    return map;
  }, [containers]);

  // Conteneurs filtrés par zone (mémorisé)
  const zoneContainers = useMemo(() => {
    if (!selectedZoneId) return [];
    return containers.filter(c => (c.zoneId || c.zone_id) === selectedZoneId);
  }, [containers, selectedZoneId]);

  if (loading) {
    return (
      <div className="zones-wrapper">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zones-wrapper">
      {/* MAP CONTAINER */}
      <div className="zones-map-container">
        <MapContainer 
          center={[48.8566, 2.3522]} 
          zoom={13} 
          className="zones-map"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {/* Afficher les zones comme polygones/GeoJSON */}
          {zones.map((zone) => {
            if (!zone.geometrie && (!zone.latitude || !zone.longitude)) return null;
            
            // Si zone a une géométrie GeoJSON (polygon, multipolygon, etc.)
            if (zone.geometrie) {
              try {
                return (
                  <GeoJSON 
                    key={zone.id}
                    data={zone.geometrie}
                    eventHandlers={{
                      click: () => handleSelectZone(zone.id),
                    }}
                    style={{
                      color: selectedZoneId === zone.id ? '#0d9488' : '#2dd4bf',
                      fillOpacity: selectedZoneId === zone.id ? 0.5 : 0.2,
                      weight: selectedZoneId === zone.id ? 3 : 2,
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{zone.nom}</h4>
                        <p className="code">{zone.code_zone}</p>
                        <button onClick={() => handleSelectZone(zone.id)} className="popup-btn">
                          Voir détails
                        </button>
                      </div>
                    </Popup>
                  </GeoJSON>
                );
              } catch (e) {
                // Fall through to marker
              }
            }
            
            // Fallback: afficher un marqueur simple
            if (zone.latitude && zone.longitude) {
              return (
                <Marker
                  key={zone.id}
                  position={[zone.latitude, zone.longitude]}
                  eventHandlers={{
                    click: () => handleSelectZone(zone.id),
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h4>{zone.nom}</h4>
                      <p className="code">{zone.code_zone}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            
            return null;
          })}

          {/* Cluster des conteneurs */}
          {zoneContainers.length > 0 && (
            <MarkerClusterGroup>
              {zoneContainers.map((container) => (
                <Marker
                  key={container.id}
                  position={[
                    container.latitude || 48.8566,
                    container.longitude || 2.3522,
                  ]}
                  icon={createContainerIcon(container.status)}
                >
                  <Popup>
                    <div className="map-popup">
                      <h4>📦 {container.code_conteneur || 'Conteneur'}</h4>
                      <p className="code">{container.type_dechet || 'Standard'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>

        {/* Bouton flottant "Créer Zone" */}
        <button 
          className="create-zone-btn"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ nom: '', code_zone: '', population_estimee: '', is_active: true });
          }}
          title="Créer une nouvelle zone"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* PANEL LATÉRAL */}
      <div className="zones-panel">
        {error && (
          <div className="panel-alert error">
            <p>❌ {error}</p>
            <button onClick={() => setError(null)} className="close-alert">×</button>
          </div>
        )}

        {/* Formulaire de création/modification */}
        {showForm && (
          <div className="panel-section form-section">
            <div className="section-header">
              <h3>{editingId ? '✏️ Modifier Zone' : '➕ Créer Zone'}</h3>
              <button onClick={handleClosePanel} className="close-btn" title="Fermer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-content">
              <div className="form-group">
                <label>Nom de la zone *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Zone Nord"
                  required
                />
              </div>
              <div className="form-group">
                <label>Code zone</label>
                <input
                  type="text"
                  value={formData.code_zone}
                  onChange={(e) => setFormData({ ...formData, code_zone: e.target.value })}
                  placeholder="Ex: ZN-001"
                />
              </div>
              <div className="form-group">
                <label>Population estimée</label>
                <input
                  type="number"
                  value={formData.population_estimee}
                  onChange={(e) => setFormData({ ...formData, population_estimee: parseInt(e.target.value) || '' })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Zone active</span>
                </label>
              </div>
              <button type="submit" className="submit-btn">
                {editingId ? '💾 Modifier' : '➕ Créer Zone'}
              </button>
            </form>
          </div>
        )}

        {/* Liste des zones ou détails sélectionnés */}
        {!showForm && (
          <>
            {selectedZoneDetails ? (
              <div className="panel-section details-section">
                <div className="section-header">
                  <h3>{selectedZoneDetails.nom}</h3>
                  <button onClick={handleClosePanel} className="close-btn" title="Fermer">
                    <X size={20} />
                  </button>
                </div>

                <div className="details-content">
                  {/* Info basique */}
                  <div className="detail-card">
                    <h4>📍 Informations Générales</h4>
                    <div className="detail-item">
                      <span className="label">Code:</span>
                      <span className="value">{selectedZoneDetails.code_zone || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Population:</span>
                      <span className="value">
                        <Users size={16} style={{ marginRight: '4px' }} />
                        {selectedZoneDetails.population_estimee?.toLocaleString() || 'N/A'} hab.
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Statut:</span>
                      <span className={`badge ${selectedZoneDetails.is_active ? 'active' : 'inactive'}`}>
                        {selectedZoneDetails.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Conteneurs:</span>
                      <span className="value">
                        <Package size={16} style={{ marginRight: '4px' }} />
                        {containersByZone[selectedZoneId] || 0} conteneurs
                      </span>
                    </div>
                    {selectedZoneDetails.latitude && selectedZoneDetails.longitude && (
                      <div className="detail-item">
                        <span className="label">Coordonnées:</span>
                        <span className="value">
                          <MapPin size={16} style={{ marginRight: '4px' }} />
                          {selectedZoneDetails.latitude.toFixed(4)}, {selectedZoneDetails.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Météo */}
                  {weather && (
                    <div className="detail-card weather-card">
                      <h4>🌤️ Météo Actuelle</h4>
                      <div className="weather-grid">
                        <div className="weather-item">
                          <Cloud size={20} />
                          <span>{weather.weather?.[0]?.description || 'N/A'}</span>
                        </div>
                        <div className="weather-item">
                          <span className="temp">{Math.round(weather.main?.temp || 0)}°C</span>
                        </div>
                        <div className="weather-item">
                          <Wind size={20} />
                          <span>{Math.round(weather.wind?.speed || 0)} m/s</span>
                        </div>
                        <div className="weather-item">
                          <Droplets size={20} />
                          <span>{weather.main?.humidity || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conteneurs de cette zone */}
                  {zoneContainers.length > 0 && (
                    <div className="detail-card">
                      <h4>📦 Conteneurs ({zoneContainers.length})</h4>
                      <div className="containers-list">
                        {zoneContainers.map((container) => (
                          <div key={container.id} className="container-item">
                            <div className="container-header">
                              <span className="code">{container.code_conteneur || 'Conteneur'}</span>
                              <span className={`status ${container.status || 'active'}`}>
                                {container.status === 'active' ? '🟢' : '🔴'}
                              </span>
                            </div>
                            <div className="container-info">
                              <span>{container.type_dechet || 'Standard'}</span>
                              {container.taux_remplissage && (
                                <span className="fill-level">
                                  {Math.round(container.taux_remplissage)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="details-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(selectedZoneDetails)}
                    >
                      <Edit2 size={16} /> Modifier
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(selectedZoneDetails.id)}
                    >
                      <Trash2 size={16} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Liste des zones */
              <div className="panel-section zones-list-section">
                <div className="section-header">
                  <h3>🗺️ Zones ({zones.length})</h3>
                </div>
                <div className="zones-list">
                  {zones.length === 0 ? (
                    <p className="empty-state">Aucune zone disponible. Créez-en une !</p>
                  ) : (
                    zones.map((zone, idx) => (
                      <div
                        key={zone.id}
                        className={`zone-item ${selectedZoneId === zone.id ? 'active' : ''}`}
                        onClick={() => handleSelectZone(zone.id)}
                        style={{
                          borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`,
                        }}
                      >
                        <div className="zone-info">
                          <h4>{zone.nom}</h4>
                          <p className="code">{zone.code_zone || 'N/A'}</p>
                          <div className="zone-stats">
                            <span className="stat">
                              👥 {zone.population_estimee?.toLocaleString() || '?'} hab.
                            </span>
                            <span className="stat">
                              📦 {containersByZone[zone.id] || 0}
                            </span>
                          </div>
                        </div>
                        <div className={`status-badge ${zone.is_active ? 'active' : 'inactive'}`}>
                          {zone.is_active ? '●' : '○'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
