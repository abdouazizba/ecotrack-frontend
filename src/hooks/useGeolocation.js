import { useState, useEffect } from 'react';

export default function useGeolocation(watch = true) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    const onSuccess = (pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    };

    const onError = (err) => {
      setError(err.message);
    };

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(id);
    }
  }, [watch]);

  return { position, error };
}
