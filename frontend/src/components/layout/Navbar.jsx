import { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Bell, MessageCircle, LogOut, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { useLocationContext } from '../../context/LocationContext.jsx';
import { LocationModal } from '../ui/LocationModal.jsx';

import { getImageUrl, handleImageError } from '../../utils/imageUrl.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, unreadDMsCount } = useContext(NotificationContext);
  const { location } = useLocationContext();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      navigate(`/?search=${encodeURIComponent(searchVal.trim())}`);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-40 ml-sidebar border-b border-ink-100 bg-white dark:bg-[#0D1026] dark:border-purple-950/20 dark:text-white transition-colors duration-200">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Search bar + Location Selector */}
          <div className="flex items-center gap-3">
            <div className="relative w-[340px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search activities, people..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-10 pr-10 text-sm text-ink-700 placeholder-ink-300 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-[#080A18]/65 dark:border-purple-950/25 dark:text-slate-100 dark:placeholder-slate-600"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-2xs text-ink-300 dark:bg-[#080A18] dark:border-purple-950/20 dark:text-slate-500">
                /
              </kbd>
            </div>

            {/* Location Selector Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 transition-all cursor-pointer text-xs font-semibold"
              title="Change your location"
            >
              <MapPin className="h-4 w-4 text-brand-500 flex-shrink-0" />
              <span className="max-w-[150px] truncate">{location.placeName || 'Select Location'}</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-brand-500/20 text-brand-600 dark:text-brand-300">
                {location.source}
              </span>
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Bell / notifications */}
            <Link
              to="/notifications"
              aria-label="View notifications"
              className="relative rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-purple-950/20 dark:hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-red text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Messages */}
            <Link
              to="/messages"
              aria-label="View direct messages"
              className="relative rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-purple-950/20 dark:hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
              {unreadDMsCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-red text-[10px] font-semibold text-white">
                  {unreadDMsCount}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div className="h-8 w-px bg-ink-100 dark:bg-purple-950/20" />

            {user ? (
              <div className="flex items-center gap-3">
                {/* Avatar + info */}
                <Link to="/profile" aria-label="Go to my profile" className="flex items-center gap-3">
                  <img
                    src={getImageUrl(user.avatarUrl, user.name || 'User')}
                    alt={user.name || 'User'}
                    onError={(e) => handleImageError(e, user.name || 'User')}
                    className="h-9 w-9 rounded-full border border-ink-100 bg-ink-50 dark:border-purple-950/20 object-cover"
                  />
                  <div className="hidden flex-col sm:flex">
                    <span className="text-sm font-medium leading-tight text-ink-700 dark:text-slate-200">
                      {user.name || 'Member'}
                    </span>
                    <span className={`text-2xs font-medium leading-tight ${user.trustScore >= 80 ? 'text-trust-high' : user.trustScore >= 50 ? 'text-trust-medium' : 'text-trust-low'}`}>
                      Trust Score {user.trustScore ?? 50}
                    </span>
                  </div>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-purple-950/20 dark:hover:text-white"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
        <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
      </header>
    </>
  );
}
