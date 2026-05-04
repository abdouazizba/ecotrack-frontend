import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getZones } from '../../../services/api';
import './ZonesMap.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createMarkerIcon = (status) => {
  const color = status === 'active' ? '#4CAF50' : '#ff9800';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      ">
        📍
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export default function ZonesMap() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await getZones();
      const zonesData = Array.isArray(data) ? data : data.data || [];
      console.log('📍 Zones data:', zonesData);
      console.log('📍 First zone coords:', zonesData[0]?.latitude, zonesData[0]?.longitude);
      setZones(zonesData);
    } catch (err) {
      console.error('Erreur lors du chargement des zones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter zones with valid coordinates
  const zonesWithCoords = zones.filter(
    zone => zone.latitude && zone.longitude && 
             zone.latitude !== 0 && zone.longitude !== 0
  );

  console.log('📍 Zones with coords:', zonesWithCoords.length, 'tota:', zones.length);

  const centerLat = zonesWithCoords.length > 0 
    ? zonesWithCoords[0].latitude 
    : 48.8566; // Paris default
  const centerLng = zonesWithCoords.length > 0 
    ? zonesWithCoords[0].longitude 
    : 2.3522; // Paris default

  if (loading) {
    return <div className="zones-map-section"><p>Chargement de la carte...</p></div>;
  }

  return (
    <div className="zones-map-section">
      <div className="zones-map-header">
        <h2>📍 Carte Interactive des Zones</h2>
        <p>{zonesWithCoords.length} zone(s) avec coordonnées · Cliquez sur les marqueurs pour voir les détails</p>
      </div>

      <div className="zones-map-container">
        {zonesWithCoords.length === 0 ? (
          <div className="map-empty">
            <p>❌ Aucune zone avec coordonnées valides</p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Les zones doivent avoir latitude et longitude &gt; 0
            </p>
          </div>
        ) : (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={13}
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
            ref={mapRef}
          >
            {/* Tile Layer - OpenStreetMap (gratuit) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Zone Markers */}
            {zonesWithCoords.map((zone) => (
              <React.Fragment key={zone.id}>
                {/* Marker with popup */}
                <Marker
                  position={[zone.latitude, zone.longitude]}
                  icon={createMarkerIcon(zone.status)}
                  eventHandlers={{
                    click: () => setSelectedZone(zone),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="popup-content">
                      <h4 style={{ margin: '0 0 8px 0' }}>{zone.name}</h4>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Code:</strong> {zone.code_zone || '-'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Population:</strong> {zone.population_estimee || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Statut:</strong>{' '}
                        <span style={{
                          background: zone.status === 'active' ? '#c8e6c9' : '#ffe0b2',
                          color: zone.status === 'active' ? '#2e7d32' : '#e65100',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '12px',
                        }}>
                          {zone.status}
                        </span>
                      </p>
                      {zone.description && (
                        <p style={{ margin: '4px 0', fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                          {zone.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Circle radius visualization (5km) */}
                <Circle
                  center={[zone.latitude, zone.longitude]}
                  radius={1000}
                  pathOptions={{
                    color: zone.status === 'active' ? '#4CAF50' : '#ff9800',
                    fillColor: zone.status === 'active' ? '#4CAF50' : '#ff9800',
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend-detailed">
        <h4>Légendes</h4>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="legend-row">
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              marginRight: '6px',
            }}></span>
            <span>Zone Active</span>
          </div>
          <div className="legend-row">
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              marginRight: '6px',
            }}></span>
            <span>Zone Inactive</span>
          </div>
          <div className="legend-row">
            <span style={{
              display: 'inline-block',
              width: '30px',
              height: '2px',
              backgroundColor: '#4CAF50',
              marginRight: '6px',
            }}></span>
            <span>Rayon de couverture (5km)</span>
          </div>
        </div>
      </div>

      {/* Selected Zone Details */}
      {selectedZone && (
        <div className="zone-details-panel">
          <div className="details-header">
            <h3>{selectedZone.name}</h3>
            <button
              className="btn-close-details"
              onClick={() => setSelectedZone(null)}
            >
              ✕
            </button>
          </div>
          <div className="details-grid">
            <div className="detail-item">
              <label>Code Zone</label>
              <p>{selectedZone.code_zone || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Population</label>
              <p>{selectedZone.population_estimee || 0}</p>
            </div>
            <div className="detail-item">
              <label>Latitude</label>
              <p>{selectedZone.latitude.toFixed(6)}</p>
            </div>
            <div className="detail-item">
              <label>Longitude</label>
              <p>{selectedZone.longitude.toFixed(6)}</p>
            </div>
            <div className="detail-item">
              <label>Statut</label>
              <p>
                <span style={{
                  background: selectedZone.status === 'active' ? '#c8e6c9' : '#ffe0b2',
                  color: selectedZone.status === 'active' ? '#2e7d32' : '#e65100',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}>
                  {selectedZone.status}
                </span>
              </p>
            </div>
            {selectedZone.created_at && (
              <div className="detail-item">
                <label>Créé le</label>
                <p>{new Date(selectedZone.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {selectedZone.description && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <p>{selectedZone.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
