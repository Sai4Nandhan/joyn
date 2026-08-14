import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, X, Check, Loader2, Compass } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext.jsx';

const POPULAR_CITIES = [
  { city: 'Warangal', state: 'Telangana', country: 'India', lat: 17.9784, lng: 79.5941, placeName: 'Warangal, Telangana' },
  { city: 'Hanamkonda', state: 'Telangana', country: 'India', lat: 18.0072, lng: 79.5583, placeName: 'Hanamkonda, Telangana' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867, placeName: 'Hyderabad, Telangana' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, placeName: 'Bengaluru, Karnataka' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777, placeName: 'Mumbai, Maharashtra' },
  { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, placeName: 'Delhi, India' },
];

export function LocationModal({ isOpen, onClose }) {
  const { location, detectLocation, setManualLocation, searchLocations } = useLocationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val || val.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      const searchRes = await searchLocations(val);
      setResults(searchRes);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectLocation = (loc) => {
    setManualLocation(loc);
    onClose();
  };

  const handleDetectGPS = async () => {
    await detectLocation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0E1126] border border-ink-100 dark:border-purple-950/40 shadow-2xl p-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-purple-950/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-white font-display">Choose your location</h2>
              <p className="text-xs text-ink-400 dark:text-slate-400">
                Discover real-world activities near your selected city
              </p>
            </div>
          </div>

          {/* GPS Auto-Detect Button */}
          <button
            onClick={handleDetectGPS}
            disabled={location.status === 'loading'}
            className="w-full flex items-center justify-center gap-2 mb-5 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-60 cursor-pointer"
          >
            {location.status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting GPS Location...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Detect My Current Location (GPS)</span>
              </>
            )}
          </button>

          {/* Current Active Location Display */}
          <div className="flex items-center justify-between p-3.5 mb-5 rounded-xl bg-ink-50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-brand-500" />
              <div>
                <p className="text-[11px] font-medium text-ink-400 dark:text-slate-400 uppercase tracking-wider">Active Location</p>
                <p className="text-xs font-bold text-ink-800 dark:text-white">{location.placeName}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
              location.source === 'GPS' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
            }`}>
              {location.source}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search city, district, or place (e.g. Warangal, Hanamkonda)"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-ink-200 dark:border-purple-900/40 bg-white dark:bg-[#151936] text-ink-900 dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-brand-500" />
            )}
          </div>

          {/* Search Results List */}
          {results.length > 0 && (
            <div className="mb-5 max-h-48 overflow-y-auto rounded-xl border border-ink-100 dark:border-purple-900/30 bg-white dark:bg-[#151936] divide-y divide-ink-100 dark:divide-purple-900/20">
              {results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(res)}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-purple-950/40 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-ink-800 dark:text-white truncate">{res.displayName}</span>
                  <MapPin className="h-3.5 w-3.5 text-brand-500 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}

          {/* Popular Cities Quick Select Chips */}
          <div>
            <p className="text-xs font-semibold text-ink-500 dark:text-slate-400 mb-2.5">Popular / Quick Select Cities</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.map((cityObj) => {
                const isActive = location.city.toLowerCase() === cityObj.city.toLowerCase();
                return (
                  <button
                    key={cityObj.city}
                    onClick={() => handleSelectLocation(cityObj)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-ink-50 dark:bg-[#151936] text-ink-700 dark:text-slate-300 border-ink-200 dark:border-purple-900/40 hover:border-brand-400 hover:text-brand-500'
                    }`}
                  >
                    <span>{cityObj.city}</span>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
