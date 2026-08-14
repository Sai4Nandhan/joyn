import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'joyn_user_location';

const DEFAULT_LOCATION = {
  lat: 17.9784,
  lng: 79.5941,
  placeName: 'Warangal, Telangana',
  city: 'Warangal',
  state: 'Telangana',
  country: 'India',
  source: 'DEFAULT', // 'GPS' | 'MANUAL' | 'DEFAULT'
  status: 'idle',    // 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'manual'
  error: null,
};

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return { ...DEFAULT_LOCATION, ...parsed, status: parsed.source === 'MANUAL' ? 'manual' : 'granted' };
        }
      }
    } catch {
      // Ignore storage parse errors
    }
    return DEFAULT_LOCATION;
  });

  const saveLocationState = (newLoc) => {
    setLocation(newLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lat: newLoc.lat,
        lng: newLoc.lng,
        placeName: newLoc.placeName,
        city: newLoc.city,
        state: newLoc.state,
        country: newLoc.country,
        source: newLoc.source,
      }));
    } catch {
      // Ignore storage write errors
    }
  };

  const GEO_CACHE_KEY = 'joyn_geo_cache';

function getGeoCache() {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setGeoCache(key, val) {
  try {
    const cache = getGeoCache();
    cache[key] = val;
    // Limit cache size to 100 entries
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      delete cache[keys[0]];
    }
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write errors
  }
}

  // Reverse geocode coordinates using OpenStreetMap Nominatim API with caching & User-Agent
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return { city: 'Unknown Location', state: '', country: 'India', placeName: 'Unknown Location' };
    }

    const cacheKey = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    const cached = getGeoCache()[cacheKey];
    if (cached) {
      return cached;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'JOYN-Activity-Platform/1.0 (contact@joyn.app)',
        },
      });

      if (res.status === 429) {
        console.warn('[LocationContext] Nominatim API rate limit reached (429). Using coordinate fallback.');
        return {
          city: 'Selected Location',
          state: '',
          country: 'India',
          placeName: `📍 ${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`,
        };
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Unknown Location';
      const state = addr.state || '';
      const country = addr.country || 'India';
      const placeName = state ? `${city}, ${state}` : `${city}, ${country}`;

      const result = { city, state, country, placeName };
      setGeoCache(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[LocationContext] Reverse geocoding failed:', err.message);
      return {
        city: 'Detected Location',
        state: '',
        country: 'India',
        placeName: `📍 ${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`,
      };
    }
  }, []);

  // Search locations by query string (city / place search) with caching
  const searchLocations = useCallback(async (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const searchCacheKey = `search_${q}`;
    const cachedSearch = getGeoCache()[searchCacheKey];
    if (cachedSearch) {
      return cachedSearch;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'JOYN-Activity-Platform/1.0 (contact@joyn.app)',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      
      const results = data.map((item) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
        const state = addr.state || '';
        const country = addr.country || '';
        const placeName = state ? `${city}, ${state}` : item.display_name.split(',').slice(0, 2).join(', ');

        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          placeName,
          city,
          state,
          country,
          displayName: item.display_name,
        };
      });

      setGeoCache(searchCacheKey, results);
      return results;
    } catch (err) {
      console.error('[LocationContext] Location search error:', err.message);
      return [];
    }
  }, []);

  // Detect location via browser Geolocation API
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        status: 'unsupported',
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, status: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const geoDetails = await reverseGeocode(lat, lng);

        const newLoc = {
          lat,
          lng,
          placeName: geoDetails.placeName,
          city: geoDetails.city,
          state: geoDetails.state,
          country: geoDetails.country,
          source: 'GPS',
          status: 'granted',
          error: null,
        };

        saveLocationState(newLoc);
      },
      (error) => {
        console.warn('[LocationContext] Geolocation denied or unavailable:', error.message);
        let errorMsg = 'Unable to detect your current GPS location.';
        if (error.code === 1) errorMsg = 'Location permission denied by browser.';
        else if (error.code === 2) errorMsg = 'Position unavailable. Check device GPS.';
        else if (error.code === 3) errorMsg = 'Location request timed out.';

        setLocation((prev) => ({
          ...prev,
          status: 'denied',
          error: errorMsg,
        }));
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, [reverseGeocode]);

  // Manually select location
  const setManualLocation = useCallback((manualLoc) => {
    const newLoc = {
      lat: Number(manualLoc.lat),
      lng: Number(manualLoc.lng),
      placeName: manualLoc.placeName || manualLoc.displayName || `${manualLoc.city}, ${manualLoc.state || manualLoc.country}`,
      city: manualLoc.city || 'Custom Place',
      state: manualLoc.state || '',
      country: manualLoc.country || 'India',
      source: 'MANUAL',
      status: 'manual',
      error: null,
    };
    saveLocationState(newLoc);
  }, []);

  // On initial mount: if no saved manual location, detect location via GPS once
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      detectLocation();
    }
  }, [detectLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        detectLocation,
        setManualLocation,
        searchLocations,
        reverseGeocode,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return ctx;
}
