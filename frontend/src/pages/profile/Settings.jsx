import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, MessageSquare, Award, Star, Info } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { updateMyProfile } from '../../services/userService.js';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [emailNotify, setEmailNotify] = useState(true);
  const [pushNotify, setPushNotify] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [showLocation, setShowLocation] = useState(true);

  // Global & Category Notification Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [categories, setCategories] = useState({
    activityUpdates: true,
    joinRequests: true,
    messages: true,
    roomMessages: true,
    ratings: true,
    trustScore: true,
    challenges: true,
    announcements: true,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.settings) {
      setEmailNotify(user.settings.emailNotify ?? true);
      setPushNotify(user.settings.pushNotify ?? false);
      setProfilePrivate(user.settings.profilePrivate ?? false);
      setShowLocation(user.settings.showLocation ?? true);
      setNotificationsEnabled(user.settings.notificationsEnabled ?? true);
      if (user.settings.notificationCategories) {
        setCategories((prev) => ({ ...prev, ...user.settings.notificationCategories }));
      }
    }
  }, [user]);

  const handleCategoryChange = (key, val) => {
    setCategories((prev) => ({ ...prev, [key]: val }));
  };

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    try {
      const updatedUser = await updateMyProfile({
        settings: {
          emailNotify,
          pushNotify,
          profilePrivate,
          showLocation,
          notificationsEnabled,
          notificationCategories: categories,
        },
      });
      setUser(updatedUser);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings');
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl pb-12">
        <h1 className="text-2xl font-bold text-ink-800 dark:text-white mb-2 font-display">Account Settings</h1>
        <p className="text-sm text-ink-400 dark:text-slate-400 mb-6">
          Manage notification controls, privacy preferences, and account security.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Master Notification Toggle */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0D1026] via-[#161A3D] to-[#251A54] border border-purple-500/20 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-display">Allow All Notifications</h3>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Master control for all non-critical activity, room message, and challenge notifications. Account security alerts remain always active.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Categorized Notification Controls */}
          <div className={`rounded-xl bg-white border border-ink-100 dark:bg-[#0D1026] dark:border-purple-950/20 p-5 shadow-card transition-all ${
            !notificationsEnabled ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <h3 className="text-sm font-bold text-ink-900 dark:text-slate-200 flex items-center gap-2 mb-4">
              <MessageSquare className="h-4.5 w-4.5 text-brand-500" />
              Notification Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Activity Room Messages</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">Group chat & voice message alerts.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.roomMessages}
                  onChange={(e) => handleCategoryChange('roomMessages', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Join Requests</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">Host join requests & approvals.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.joinRequests}
                  onChange={(e) => handleCategoryChange('joinRequests', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Direct Messages</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">1-on-1 private peer messages.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.messages}
                  onChange={(e) => handleCategoryChange('messages', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Challenges & Badges</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">Achievement milestone unlocks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.challenges}
                  onChange={(e) => handleCategoryChange('challenges', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Ratings & Reviews</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">Peer feedback & ratings.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.ratings}
                  onChange={(e) => handleCategoryChange('ratings', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-ink-50/50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-slate-100">Host Announcements</p>
                  <p className="text-[10px] text-ink-400 dark:text-slate-400">Important host broadcasts.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.announcements}
                  onChange={(e) => handleCategoryChange('announcements', e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="rounded-xl bg-white border border-ink-100 dark:bg-[#0D1026] dark:border-purple-950/20 p-5 shadow-card">
            <h3 className="text-sm font-bold text-ink-900 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Shield className="h-4.5 w-4.5 text-brand-500" />
              Privacy & Location Options
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-800 dark:text-slate-100">Private Profile</p>
                  <p className="text-xs text-ink-400 dark:text-slate-400">Only approved contacts can view your full public profile.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profilePrivate}
                  onChange={(e) => setProfilePrivate(e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4.5 w-4.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-800 dark:text-slate-100">Share Approximate Location</p>
                  <p className="text-xs text-ink-400 dark:text-slate-400">Allow others to see approximate distance to activities.</p>
                </div>
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="rounded border-ink-300 dark:border-purple-950/30 text-brand-500 focus:ring-brand-400 h-4.5 w-4.5"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {isSaved && (
              <span className="text-sm text-emerald-600 font-semibold animate-pulse">
                Settings saved successfully!
              </span>
            )}
            {error && (
              <span className="text-sm text-red-500 font-semibold">
                {error}
              </span>
            )}
            <button
              type="submit"
              className="ml-auto h-11 px-8 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-bold text-white shadow-md cursor-pointer transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
