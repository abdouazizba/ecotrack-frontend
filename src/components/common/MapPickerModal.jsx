import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { X, MapPin, Check } from 'lucide-react';
import './MapPickerModal.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [48.8566, 2.3522]; // Paris IDF
const DEFAULT_ZOOM   = 13;

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

export default function MapPickerModal({ show, initialLat, initialLng, onConfirm, onClose }) {
  const startPos = initialLat && initialLng
    ? [parseFloat(initialLat), parseFloat(initialLng)]
    : null;

  const [position, setPosition] = useState(startPos);

  if (!show) return null;

  const handleConfirm = () => {
    if (!position) return;
    onConfirm(position.lat ?? position[0], position.lng ?? position[1]);
    onClose();
  };

  const lat = position ? (position.lat ?? position[0]).toFixed(6) : '—';
  const lng = position ? (position.lng ?? position[1]).toFixed(6) : '—';

  return (
    <div className="mpm-overlay" onClick={onClose}>
      <div className="mpm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mpm-header">
          <div className="mpm-header-left">
            <MapPin size={16} />
            <span>Choisir une localisation</span>
          </div>
          <button className="mpm-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Hint */}
        <p className="mpm-hint">Cliquez sur la carte pour placer le marqueur</p>

        {/* Map */}
        <div className="mpm-map-wrap">
          <MapContainer
            center={startPos || DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ width: '100%', height: '380px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ClickHandler onPick={setPosition} />
            {position && <Marker position={position} />}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="mpm-footer">
          <div className="mpm-coords">
            <span className="mpm-coord-label">Lat</span>
            <span className="mpm-coord-val">{lat}</span>
            <span className="mpm-coord-sep" />
            <span className="mpm-coord-label">Lng</span>
            <span className="mpm-coord-val">{lng}</span>
          </div>
          <div className="mpm-actions">
            <button className="mpm-btn-cancel" onClick={onClose}>Annuler</button>
            <button
              className="mpm-btn-confirm"
              onClick={handleConfirm}
              disabled={!position}
            >
              <Check size={14} /> Confirmer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
