import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Link as LinkIcon, CheckCircle2, ExternalLink, RefreshCw, AlertCircle, X, TouchpadIcon } from 'lucide-react';
import { parseMapUrl } from '../../utils/mapParser.js';
import { InteractiveMapPin } from './InteractiveMapPin.jsx';

export function LocationPicker({ value, onChange }) {
  // Mode: 'pin' | 'search' | 'mapLink'
  const [mode, setMode] = useState('pin');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [mapInputUrl, setMapInputUrl] = useState('');
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [error, setError] = useState(null);
  const [canSearchFallback, setCanSearchFallback] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Handle Search Input Change with Debouncing (350ms)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);
    setCanSearchFallback(false);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim() || query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`,
          { headers: { 'User-Agent': 'JOYN-Activity-Platform/1.0' } }
        );
        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select Place Result from Nominatim
  const handleSelectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const placeName = place.display_name.split(',')[0].trim();
    const cityState = place.display_name.split(',').slice(1, 3).join(',').trim();
    const fullDisplayName = `${placeName}${cityState ? `, ${cityState}` : ''}`;

    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

    onChange({
      lat,
      lng,
      placeName: fullDisplayName,
      address: place.display_name,
      mapUrl,
      source: 'search',
    });

    setSearchResults([]);
    setSearchQuery('');
    setError(null);
  };

  // GPS "Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let placeName = 'Current Location';
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'User-Agent': 'JOYN-Activity-Platform/1.0' },
          });
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name;
            const parts = data.display_name.split(',');
            placeName = `${parts[0].trim()}${parts[1] ? `, ${parts[1].trim()}` : ''}`;
          }
        } catch {
          // Ignore reverse geocoding fail
        }

        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

        onChange({
          lat,
          lng,
          placeName,
          address,
          mapUrl,
          source: 'gps',
        });

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access was denied. Please search for a place or paste a map link.');
        } else {
          setError('Unable to fetch your GPS location. Please search for a place instead.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Map Link Submission
  const handleParseMapLink = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setCanSearchFallback(false);

    if (!mapInputUrl.trim()) {
      setError('Please paste a Google Maps or Apple Maps link.');
      return;
    }

    setIsParsingLink(true);

    try {
      const result = await parseMapUrl(mapInputUrl);
      if (result.success) {
        let placeName = result.displayName || 'Selected Map Location';
        let address = result.displayName || mapInputUrl;

        if (!result.displayName) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.lat}&lon=${result.lng}`, {
              headers: { 'User-Agent': 'JOYN-Activity-Platform/1.0' },
            });
            const data = await res.json();
            if (data && data.display_name) {
              address = data.display_name;
              const parts = data.display_name.split(',');
              placeName = `${parts[0].trim()}${parts[1] ? `, ${parts[1].trim()}` : ''}`;
            }
          } catch {
            // Ignore
          }
        }

        onChange({
          lat: result.lat,
          lng: result.lng,
          placeName,
          address,
          mapUrl: result.mapUrl || mapInputUrl,
          source: 'map_link',
        });
        setMapInputUrl('');
      } else {
        setError(result.error);
        if (result.canSearch) setCanSearchFallback(true);
      }
    } catch {
      setError('Could not process this map link. Please search for the location instead.');
      setCanSearchFallback(true);
    } finally {
      setIsParsingLink(false);
    }
  };

  // Clear Selected Location
  const handleClearLocation = () => {
    onChange(null);
    setError(null);
    setSearchQuery('');
    setMapInputUrl('');
  };

  return (
    <div className="space-y-4">
      {/* Mode Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => { setMode('pin'); setError(null); }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'pin'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <MapPin className="h-4 w-4 text-rose-500" />
          Drop Pin
        </button>

        <button
          type="button"
          onClick={() => { setMode('search'); setError(null); }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'search'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Search className="h-4 w-4 text-violet-500" />
          Search
        </button>

        <button
          type="button"
          onClick={() => { setMode('mapLink'); setError(null); }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'mapLink'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-md border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <LinkIcon className="h-4 w-4 text-amber-500" />
          Map Link
        </button>
      </div>

      {/* CONFIRMED LOCATION BANNER */}
      {value && value.lat != null && value.lng != null && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                  Location Confirmed
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                  {value.placeName}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white underline"
              >
                Change
              </button>
            </div>
          </div>

          {value.address && value.address !== value.placeName && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              📍 {value.address}
            </p>
          )}

          {value.mapUrl && (
            <a
              href={value.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.02]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Maps
            </a>
          )}
        </div>
      )}

      {/* MODE 1: INTERACTIVE CLICK-TO-DROP-PIN MAP */}
      {mode === 'pin' && (
        <div className="space-y-3">
          <InteractiveMapPin
            lat={value?.lat}
            lng={value?.lng}
            onLocationSelect={onChange}
          />

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLocating ? (
              <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />
            ) : (
              <Navigation className="h-4 w-4 text-violet-500 fill-violet-500/20" />
            )}
            {isLocating ? 'Detecting GPS location...' : 'Center Map to My Current Location'}
          </button>
        </div>
      )}

      {/* MODE 2: SEARCH PLACE */}
      {mode === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for a city, venue, area, or landmark..."
              className="h-12 w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {isSearching && (
              <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left p-3.5 hover:bg-violet-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-violet-500 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {place.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {place.display_name.split(',').slice(1).join(',')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLocating ? (
              <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />
            ) : (
              <Navigation className="h-4 w-4 text-violet-500 fill-violet-500/20" />
            )}
            {isLocating ? 'Detecting GPS location...' : 'Use My Current Location'}
          </button>
        </div>
      )}

      {/* MODE 3: PASTE MAP LINK */}
      {mode === 'mapLink' && (
        <form onSubmit={handleParseMapLink} className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Paste Google Maps or Apple Maps Link
            </label>
            <div className="relative">
              <input
                type="url"
                value={mapInputUrl}
                onChange={(e) => { setMapInputUrl(e.target.value); setError(null); }}
                placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                className="h-12 w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isParsingLink || !mapInputUrl.trim()}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-500/10 cursor-pointer"
          >
            {isParsingLink ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              'Add Location from Link'
            )}
          </button>
        </form>
      )}

      {/* Error Message & Fallback Action */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 space-y-2 text-xs text-rose-600 dark:text-rose-300">
          <div className="flex gap-2 items-center">
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>

          {canSearchFallback && (
            <button
              type="button"
              onClick={() => { setMode('search'); setError(null); setCanSearchFallback(false); }}
              className="mt-2 text-xs font-bold text-rose-500 underline hover:text-rose-600 block"
            >
              Search Location Instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
