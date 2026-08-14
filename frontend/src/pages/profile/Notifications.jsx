import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, ShieldAlert, Award } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { NotificationContext } from '../../context/NotificationContext.jsx';

const NOTIF_CONFIG = {
  success: {
    Icon: Check,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  announcement: {
    Icon: Bell,
    color: 'bg-brand-50 text-brand-600 border-brand-100',
  },
  badge: {
    Icon: Award,
    color: 'bg-purple-50 text-purple-600 border-purple-100',
  },
  alert: {
    Icon: ShieldAlert,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  info: {
    Icon: Bell,
    color: 'bg-brand-50 text-brand-600 border-brand-100',
  },
};

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    sync,
    markAllRead,
    markRead,
    removeNotification,
  } = useContext(NotificationContext);

  useEffect(() => {
    sync();
  }, [sync]);

  const handleNotificationClick = (n, id) => {
    if (n.unread) {
      markRead(id);
    }

    if (n.link) {
      navigate(n.link);
      return;
    }

    // Intelligent fallback routing based on notification content
    const titleLower = (n.title || '').toLowerCase();
    const contentLower = (n.content || '').toLowerCase();

    if (titleLower.includes('request') || contentLower.includes('request')) {
      navigate('/my-activities');
    } else if (titleLower.includes('challenge') || titleLower.includes('badge') || contentLower.includes('badge')) {
      navigate('/challenges');
    } else if (titleLower.includes('rating') || titleLower.includes('review') || contentLower.includes('rate')) {
      navigate('/my-activities');
    } else if (titleLower.includes('message') || contentLower.includes('message')) {
      navigate('/messages');
    } else {
      navigate('/my-activities');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-800 dark:text-white">Notifications</h1>
            <p className="text-sm text-ink-400 dark:text-slate-400">Updates regarding your activities, requests, and trust score.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-white border border-ink-100 dark:bg-[#0E1126] dark:border-purple-950/30 shadow-card">
            <Bell className="h-10 w-10 text-ink-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-ink-400 dark:text-slate-400">You don't have any notifications.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => {
              const id = n._id || n.id;
              const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.info;
              const { Icon, color } = config;
              return (
                <div
                  key={id}
                  onClick={() => handleNotificationClick(n, id)}
                  className={`group relative flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all bg-white dark:bg-[#0E1126] hover:shadow-md cursor-pointer ${
                    n.unread ? 'border-brand-300 ring-1 ring-brand-100 dark:border-brand-500/40 dark:ring-purple-900/40' : 'border-ink-100 dark:border-purple-950/30 hover:border-brand-400'
                  }`}
                >
                  {/* Icon indicator */}
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Body content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-ink-800 dark:text-white leading-tight group-hover:text-brand-500 transition-colors">
                        {n.title}
                      </h4>
                      {n.unread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ink-600 dark:text-slate-300 leading-relaxed mb-1.5">{n.content}</p>
                    <span className="text-[10px] text-ink-300 dark:text-slate-500 font-medium">{formatTime(n.createdAt)}</span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(id);
                    }}
                    className="absolute top-4 right-4 rounded-lg p-1 text-ink-300 hover:bg-ink-50 hover:text-ink-600 dark:hover:bg-purple-950/40 dark:hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
