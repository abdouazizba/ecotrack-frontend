import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { getNearbyContainers } from '../../../services/api';
import { MapPin, Navigation, Loader, AlertCircle } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TYPE_LABELS = {
  standard: 'Standard',
  selective: 'Sélectif',
  organic: 'Organique',
  hazardous: 'Dangereux',
};

const TYPE_COLORS = {
  standard: '#6b7280',
  selective: '#3b82f6',
  organic: '#10b981',
  hazardous: '#ef4444',
};

const STATUS_COLORS = {
  actif: '#10b981',
  maintenance: '#f59e0b',
  retire: '#6b7280',
};

const createContainerIcon = (type, fillLevel) => {
  const color = fillLevel >= 80 ? '#ef4444' : fillLevel >= 60 ? '#f59e0b' : TYPE_COLORS[type] || '#6b7280';
  return L.divIcon({
    html: `<div style="
      background:${color};width:36px;height:36px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:14px;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);">🗑️</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const createUserIcon = () =>
  L.divIcon({
    html: `<div style="
      background:#6366f1;width:40px;height:40px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:18px;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);">📍</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

const DEFAULT_CENTER = [14.6937, -17.4441]; // Dakar par défaut

export default function NearbyContainersMap({ onSelectContainer }) {
  const [containers, setContainers] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [radius, setRadius] = useState(2);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  const loadNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const data = await getNearbyContainers({ lat, lng, radius });
      setContainers(data);
    } catch {
      setContainers([]);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const locateUser = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        loadNearby(latitude, longitude);
      },
      () => {
        setGeoError('Impossible d\'obtenir votre position. Vérifiez les permissions.');
        loadNearby(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      }
    );
  }, [loadNearby]);

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    if (userPosition) {
      loadNearby(userPosition[0], userPosition[1]);
    }
  }, [radius]);

  return (
    <div className="nearby-map-container">
      <div className="nearby-map-header">
        <div className="nearby-map-title">
          <MapPin size={18} />
          <span>Conteneurs à proximité</span>
          {!loading && <span className="nearby-count">{containers.length} trouvé{containers.length > 1 ? 's' : ''}</span>}
          {loading && <Loader size={14} className="spin" />}
        </div>
        <div className="nearby-map-controls">
          <label className="radius-label">Rayon :</label>
          {[1, 2, 5, 10].map((r) => (
            <button
              key={r}
              className={`radius-btn ${radius === r ? 'active' : ''}`}
              onClick={() => setRadius(r)}
            >
              {r} km
            </button>
          ))}
          <button className="locate-btn" onClick={locateUser} title="Ma position">
            <Navigation size={14} />
          </button>
        </div>
      </div>

      {geoError && (
        <div className="nearby-geo-error">
          <AlertCircle size={14} />
          <span>{geoError}</span>
        </div>
      )}

      <div className="nearby-map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          key={mapCenter.toString()}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {userPosition && (
            <>
              <Circle
                center={userPosition}
                radius={radius * 1000}
                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1.5, dashArray: '6' }}
              />
              <Marker position={userPosition} icon={createUserIcon()}>
                <Popup><strong>Votre position</strong></Popup>
              </Marker>
            </>
          )}

          {containers.map((c) => (
            <Marker
              key={c.id}
              position={[c.latitude || 0, c.longitude || 0]}
              icon={createContainerIcon(c.type, c.fillLevel ?? 0)}
              eventHandlers={{ click: () => onSelectContainer && onSelectContainer(c) }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{c.code_conteneur || c.name}</strong>
                  <span className="popup-type">{TYPE_LABELS[c.type] || c.type}</span>
                  {c.fillLevel != null && (
                    <div className="popup-fill">
                      <div className="popup-fill-bar" style={{ width: `${c.fillLevel}%`, background: c.fillLevel >= 80 ? '#ef4444' : '#10b981' }} />
                      <span>{c.fillLevel}% plein</span>
                    </div>
                  )}
                  {c.distanceKm != null && <span className="popup-dist">{c.distanceKm.toFixed(2)} km</span>}
                  {onSelectContainer && (
                    <button className="popup-report-btn" onClick={() => onSelectContainer(c)}>
                      Signaler ce conteneur
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {containers.length > 0 && (
        <div className="nearby-list">
          {containers.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="nearby-list-item"
              onClick={() => onSelectContainer && onSelectContainer(c)}
            >
              <div className="nearby-item-dot" style={{ background: STATUS_COLORS[c.status] || '#6b7280' }} />
              <div className="nearby-item-info">
                <span className="nearby-item-code">{c.code_conteneur || c.name}</span>
                <span className="nearby-item-type">{TYPE_LABELS[c.type] || c.type}</span>
              </div>
              <div className="nearby-item-right">
                {c.fillLevel != null && (
                  <span className={`nearby-fill-badge ${c.fillLevel >= 80 ? 'critical' : c.fillLevel >= 60 ? 'warn' : 'ok'}`}>
                    {c.fillLevel}%
                  </span>
                )}
                {c.distanceKm != null && <span className="nearby-dist">{c.distanceKm.toFixed(2)} km</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
