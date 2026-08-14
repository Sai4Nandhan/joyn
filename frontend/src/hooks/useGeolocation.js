import { useEffect, useState } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | granted | denied | unsupported

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, status };
}
