import React from 'react';
import { Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import useGeolocation from '../../hooks/useGeolocation';

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #3b82f6; border: 3px solid #fff;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function UserLocationMarker({ flyTo = false }) {
  const { position } = useGeolocation();
  const map = useMap();

  React.useEffect(() => {
    if (position && flyTo) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.5 });
    }
  }, [position, flyTo, map]);

  if (!position) return null;

  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={100}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
      />
      <Marker position={[position.lat, position.lng]} icon={userIcon} />
    </>
  );
}
