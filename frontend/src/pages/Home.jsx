import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, ChevronRight, X, Calendar, Users, Eye, Shield, CheckCircle2, Star } from 'lucide-react';
import { Layout } from '../components/layout/Layout.jsx';
import LandingPage from './LandingPage.jsx';
import { ActivityCard, ActivityCardSkeleton } from '../components/ui/ActivityCard.jsx';
import { CategoryPills } from '../components/ui/CategoryPills.jsx';
import { MapWidget } from '../components/ui/MapWidget.jsx';
import { RecommendationCard } from '../components/ui/RecommendationCard.jsx';
import { CategoryGrid } from '../components/ui/CategoryGrid.jsx';
import { CATEGORY_OPTIONS, discoverActivitiesRequest } from '../services/activityService.js';
import { useLocationContext } from '../context/LocationContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { JourneyCard } from '../components/dashboard/JourneyCard.jsx';

const PAGE_SIZE = 9;

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { location } = useLocationContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const searchVal = searchParams.get('search') || '';

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const setCategory = (newCat) => {
    const params = new URLSearchParams(searchParams);
    if (newCat && newCat !== 'all') {
      params.set('category', newCat);
    } else {
      params.delete('category');
    }
    setSearchParams(params, { replace: false });
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params, { replace: false });
  };

  // Map Modal State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedMapActivity, setSelectedMapActivity] = useState(null);

  const locLat = location?.lat != null ? Number(location.lat) : null;
  const locLng = location?.lng != null ? Number(location.lng) : null;

  const loadActivities = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);
      try {
        const geoParams = (locLat != null && locLng != null && !isNaN(locLat) && !isNaN(locLng))
          ? { lat: locLat, lng: locLng, radiusKm: 50 }
          : {};

        const results = await discoverActivitiesRequest({
          ...geoParams,
          category: category !== 'all' ? category : undefined,
          search: searchVal || undefined,
          page: 1,
          limit: PAGE_SIZE,
        });
        setActivities(results);
      } catch (err) {
        console.error('Failed to discover activities', err);
        const details = Array.isArray(err.response?.data?.details)
          ? err.response.data.details.map((d) => `${d.path || d.param}: ${d.msg}`).join(', ')
          : '';
        const msg = details
          ? `Validation failed: ${details}`
          : err.response?.data?.message || err.response?.data?.error || (err.code === 'ECONNABORTED' ? 'Connection timeout. Please check backend server.' : 'Failed to load activities from server.');
        setError(msg);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    },
    [locLat, locLng, category, searchVal]
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-[#090A1A]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-xs font-medium text-ink-400 dark:text-slate-400 font-display">Loading JOYN...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }



  // Recommended activities: select 3 upcoming activities that match user interests or general
  const currentUserId = String(user?.id || user?._id || '');
  const recommendedActivities = activities
    .filter(a => {
      const hostId = String(a.host?.id || a.host?._id || a.host || '');
      return !hostId || !currentUserId || hostId !== currentUserId;
    })
    .slice(0, 3)
    .map((act) => ({
      id: act.id,
      image: act.coverImageUrl || 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=120&h=120&fit=crop',
      title: act.title,
      date: new Date(act.schedule.startAt).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      location: act.approxLocation.placeName,
      reason: `Recommended because it matches category: ${CATEGORY_OPTIONS.find(c => c.value === act.category)?.label || act.category}`,
    }));

  // Triggered by Map Widget pin click
  function handleMapPinClick(filterCategory) {
    setCategory(filterCategory);
    setIsMapOpen(true);
  }

  // Right sidebar content
  const rightSidebar = (
    <div className="flex flex-col gap-6">
      <MapWidget 
        onViewMap={() => setIsMapOpen(true)} 
        onPinClick={handleMapPinClick} 
      />

      {/* Recommended For You */}
      <div>
        <h3 className="text-sm font-semibold text-ink-800 dark:text-white mb-3">Recommended For You</h3>
        <div className="flex flex-col gap-3">
          {recommendedActivities.length > 0 ? (
            recommendedActivities.map((rec) => (
              <RecommendationCard key={rec.id} {...rec} />
            ))
          ) : (
            <p className="text-xs text-ink-400 italic">No recommendations available. Try creating activities nearby!</p>
          )}
        </div>
      </div>

      <CategoryGrid onSelect={setCategory} />
    </div>
  );

  // Location center for relative coordinates mapping
  const centerLat = location?.lat || 17.9784;
  const centerLng = location?.lng || 79.5941;

  return (
    <Layout rightSidebar={rightSidebar}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0D1026] px-4 py-5 sm:px-8 sm:py-8 mb-6 border border-purple-950/20 shadow-lifted">
        {/* Glow Effects */}
        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-[#7c3aed]/20 blur-[80px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#ea580c]/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-10 right-32 w-48 h-48 rounded-full bg-[#db2777]/10 blur-[60px] pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Find Your People. Do More Together.
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-5">
            Discover real-world activities with people you can trust.
          </p>
          <CategoryPills selected={category} onChange={setCategory} />
        </div>
      </div>

      {/* Trust Signals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-7">
        <div className="flex items-center gap-2.5 rounded-xl bg-white border border-ink-100 px-3 py-2.5 shadow-sm dark:bg-[#0D1026] dark:border-purple-950/20">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/20">
            <Shield className="h-4 w-4 text-brand-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-ink-800 leading-none dark:text-white">Trust Scores</p>
            <p className="text-[9px] text-ink-400 mt-0.5 leading-none">Every member rated</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white border border-ink-100 px-3 py-2.5 shadow-sm dark:bg-[#0D1026] dark:border-purple-950/20">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-ink-800 leading-none dark:text-white">ID Verified</p>
            <p className="text-[9px] text-ink-400 mt-0.5 leading-none">Real identities only</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white border border-ink-100 px-3 py-2.5 shadow-sm dark:bg-[#0D1026] dark:border-purple-950/20">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-ink-800 leading-none dark:text-white">Behaviour Ratings</p>
            <p className="text-[9px] text-ink-400 mt-0.5 leading-none">Peer-reviewed reputation</p>
          </div>
        </div>
      </div>

      {/* Active Filter Pill Bar */}
      {(category !== 'all' || searchVal) && (
        <div className="flex items-center gap-2 mb-4 bg-brand-50 dark:bg-purple-950/20 border border-brand-200 dark:border-purple-900/30 px-3 py-2 rounded-xl text-xs">
          <span className="font-semibold text-ink-700 dark:text-slate-300">Active filters:</span>
          {category !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-brand-500 text-white px-2 py-0.5 rounded-md text-2xs font-bold uppercase">
              {CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category}
              <button onClick={() => setCategory('all')} className="hover:text-ink-200"><X className="h-3 w-3" /></button>
            </span>
          )}
          {searchVal && (
            <span className="inline-flex items-center gap-1 bg-brand-500 text-white px-2 py-0.5 rounded-md text-2xs font-bold">
              "{searchVal}"
              <button onClick={clearSearch} className="hover:text-ink-200"><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Nearby Activities Section */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink-800 dark:text-white">
            {searchVal ? 'Search Results' : 'Nearby Activities'}
          </h2>
          <span className="flex items-center gap-1 text-xs text-brand-500 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            {location.placeName || 'Near You'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-red-700">
          <div>
            <p className="font-bold text-red-800">Connection or Query Issue</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadActivities()}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ActivityCardSkeleton key={`skeleton-${i}`} />)
          : activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
      </div>

      {!isLoading && activities.length === 0 && !error && (
        <div className="mt-8 flex flex-col items-center gap-4 text-center py-12 px-6 rounded-2xl bg-white dark:bg-[#0E1126] border border-ink-100 dark:border-purple-950/30 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <MapPin className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white font-display">No activities nearby yet.</h3>
            <p className="text-xs text-ink-500 dark:text-slate-400 mt-1 max-w-md">
              There are no published activities matching your confirmed location radius. Be the first to host an activity or explore a different city.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-ink-100 dark:bg-purple-950/50 hover:bg-ink-200 dark:hover:bg-purple-900/50 text-ink-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-brand-500" />
              <span>Explore Map Radius</span>
            </button>
            <Link
              to="/activities/create"
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>➕ Create an Activity</span>
            </Link>
          </div>
        </div>
      )}

      {/* JOYN Journey Dashboard Widget (Moved below Nearby Activities) */}
      <div className="mt-10">
        <JourneyCard />
      </div>

      {/* Stylized CSS/SVG Map Modal Dialog */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl h-[80vh] flex flex-col rounded-2xl bg-white shadow-lifted border border-ink-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-ink-900">Explore Nearby Activities</h3>
                <p className="text-xs text-ink-400">Visual mapping of activities near {location.placeName || 'your location'}</p>
              </div>
              <button
                onClick={() => { setIsMapOpen(false); setSelectedMapActivity(null); }}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Split Map / Details) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Virtual Map Area */}
              <div className="flex-1 relative bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-100 overflow-hidden">
                {/* Visual Map Layout */}
                <svg className="absolute inset-0 h-full w-full opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <path d="M 0,50 Q 200,80 400,60 T 800,40 T 1200,60" stroke="#64748b" strokeWidth="2" />
                  <path d="M 0,200 Q 300,160 600,220 T 1200,180" stroke="#64748b" strokeWidth="2.5" />
                  <path d="M 0,400 Q 400,380 800,420 T 1200,390" stroke="#64748b" strokeWidth="2" />
                  {/* Radial rings */}
                  <circle cx="50%" cy="50%" r="150" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="50%" cy="50%" r="300" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Map Pins */}
                {activities.map((act) => {
                  // Project latitude/longitude onto virtual coordinates relative to center
                  // Lat diff map scale factor: 1 degree ~ 3000px, clamped inside map container bounds
                  const latDiff = act.approxLocation.point.coordinates[1] - centerLat;
                  const lngDiff = act.approxLocation.point.coordinates[0] - centerLng;

                  const xPos = 50 + lngDiff * 40; // scaling factor
                  const yPos = 50 - latDiff * 40; // scaling factor

                  // Clamp to 5% - 95% to avoid rendering off-canvas
                  const clampedX = Math.max(5, Math.min(95, xPos));
                  const clampedY = Math.max(5, Math.min(95, yPos));

                  const isFocused = selectedMapActivity?.id === act.id;

                  const badgeColors = {
                    sports: 'bg-accent-green',
                    trips: 'bg-accent-orange',
                    social: 'bg-accent-purple',
                    travel: 'bg-accent-blue',
                    trekking: 'bg-amber-700',
                  };
                  const color = badgeColors[act.category] || 'bg-brand-500';

                  return (
                    <button
                      key={act.id}
                      onClick={() => setSelectedMapActivity(act)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all ${isFocused ? 'scale-125 z-20' : 'hover:scale-110'}`}
                      style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
                    >
                      <div className={`rounded-full ${color} p-2 text-white shadow-lifted border-2 border-white`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="mt-1 max-w-[120px] rounded bg-ink-800/90 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-white shadow-sm truncate">
                        {act.title}
                      </span>
                    </button>
                  );
                })}

                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-brand-600 animate-ping absolute" />
                  <div className="h-4 w-4 rounded-full bg-brand-500 border-2 border-white shadow-md" title="You are here" />
                </div>
              </div>

              {/* Sidebar Detail Pane */}
              <div className="w-80 border-l border-ink-100 bg-white p-5 flex flex-col justify-between overflow-y-auto">
                {selectedMapActivity ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <img
                      src={selectedMapActivity.coverImageUrl || 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=300&h=200&fit=crop'}
                      alt={selectedMapActivity.title}
                      className="w-full h-32 rounded-xl object-cover"
                    />

                    <div>
                      <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-600 capitalize mb-1">
                        {selectedMapActivity.category}
                      </span>
                      <h4 className="text-base font-bold text-ink-900 leading-tight">
                        {selectedMapActivity.title}
                      </h4>
                      <p className="mt-1 text-xs text-ink-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-ink-300" />
                        {selectedMapActivity.approxLocation.placeName}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-ink-50 pt-3">
                      <div className="flex items-center gap-2 text-xs text-ink-500">
                        <Calendar className="h-3.5 w-3.5 text-ink-300" />
                        <span>
                          {new Date(selectedMapActivity.schedule.startAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-500">
                        <Users className="h-3.5 w-3.5 text-ink-300" />
                        <span>
                          {selectedMapActivity.participantsCount} / {selectedMapActivity.capacity.max} slots filled
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-ink-50 pt-4 flex gap-2">
                      <Link 
                        to={`/activities/${selectedMapActivity.id}`}
                        className="flex-1 h-9 rounded-lg bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 flex items-center justify-center gap-1 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-ink-400 py-10">
                    <MapPin className="h-8 w-8 text-ink-200 mb-2 animate-bounce" />
                    <p className="text-xs">Click a map pin to view activity details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
