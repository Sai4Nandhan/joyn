import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import {
  Activity,
  Compass,
  CalendarDays,
  PlusCircle,
  LayoutGrid,
  MessageCircle,
  Map,
  Bell,
  User,
  Users,
  Award,
  Trophy,
  Bookmark,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Discover', icon: Compass },
  { to: '/my-activities', label: 'My Activities', icon: CalendarDays },
  { to: '/activities/new', label: 'Create Activity', icon: PlusCircle },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/rooms', label: 'Activity Room', icon: LayoutGrid },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/trips', label: 'Trips', icon: Map },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/badges', label: 'Badges', icon: Award },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function TrustScoreWidget() {
  const { user } = useAuth();
  const score = user?.trustScore ?? 50;

  let scoreColor = 'text-trust-high';
  let scoreBg = 'bg-trust-high';
  let scoreLabel = 'Excellent';

  if (score < 50) {
    scoreColor = 'text-trust-low';
    scoreBg = 'bg-trust-low';
    scoreLabel = 'Needs Work';
  } else if (score < 80) {
    scoreColor = 'text-trust-medium';
    scoreBg = 'bg-trust-medium';
    scoreLabel = 'Good';
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-[#0D1026] dark:border-purple-950/20">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className={`h-6 w-6 ${scoreColor}`} />
        <div>
          <p className={`text-2xl font-extrabold ${scoreColor}`}>{score}</p>
          <p className={`text-2xs font-semibold uppercase tracking-wider ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-ink-150 rounded-full overflow-hidden mb-3 dark:bg-purple-950/20">
        <div
          className={`h-full ${scoreBg} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <a
        href="/profile"
        className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
      >
        View Details &gt;
      </a>
    </div>
  );
}

export function Sidebar({ isMobileOpen, onClose }) {
  const { user } = useAuth();
  const { unreadCount, unreadDMsCount } = useContext(NotificationContext);

  const displayNavItems = [...navItems];
  if (user?.role === 'admin') {
    displayNavItems.push({ to: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const renderContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="mb-6 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 100 100" className="h-8 w-8 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="joynSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="50%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="25" r="14" fill="#ea580c" />
            <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynSideGrad)" />
            <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div>
            <span className="font-display text-lg font-black tracking-wider text-slate-800 dark:text-white">
              JOYN
            </span>
            <p className="text-2xs text-ink-400 dark:text-slate-500">
              Find your people. Do more.
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-purple-950/30"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
        {displayNavItems.map(({ to, label, icon: Icon }) => {
          let badgeCount = 0;
          if (label === 'Notifications') {
            badgeCount = unreadCount;
          } else if (label === 'Messages') {
            badgeCount = unreadDMsCount;
          }

          const getTourAttr = (lbl) => {
            if (lbl === 'Discover') return 'discover';
            if (lbl === 'Create Activity') return 'create-activity';
            if (lbl === 'Profile') return 'profile';
            return undefined;
          };

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={isMobile ? onClose : undefined}
              data-tour={getTourAttr(label)}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-red px-1.5 text-2xs font-semibold text-white">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Trust Score */}
      <div data-tour="trust-score" className="mt-auto pt-4 border-t border-ink-200 dark:border-purple-950/20">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-slate-500">
          Trust Score
        </p>
        <TrustScoreWidget />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-sidebar flex-col border-r border-ink-200 bg-white px-4 py-6 shadow-sidebar dark:bg-[#0D1026] dark:border-purple-950/20 transition-colors duration-200">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Content */}
          <aside className="relative flex w-4/5 max-w-xs flex-1 flex-col border-r border-ink-200 bg-white px-4 py-6 shadow-2xl dark:bg-[#0D1026] dark:border-purple-950/20">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
