import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Camera, MapPin, Calendar, Award, Star, Edit3, X } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { getMyProfile, updateMyProfile } from '../../services/userService.js';
import { TrustProfileCard } from '../../components/ui/TrustProfileCard.jsx';

import { getImageUrl } from '../../utils/imageUrl.js';

import { ProfilePhotoGallery } from '../../components/profile/ProfilePhotoGallery.jsx';
import { IdentityVerificationCard } from '../../components/profile/IdentityVerificationCard.jsx';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = () => {
    getMyProfile().then((user) => {
      setProfile(user);
      setForm({ name: user.name, bio: user.bio || '', avatarUrl: user.avatarUrl || '' });
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        </div>
      </Layout>
    );
  }

  const avatarSrc = getImageUrl(profile.avatarUrl, profile.name);
  const trustScore = profile.trustScore ?? 0;

  return (
    <Layout>
      <div className="max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* Profile Header Card */}
          <div className="rounded-2xl bg-white border border-ink-100 shadow-card overflow-hidden mb-4 sm:mb-6">
            {/* Cover gradient */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 relative">
              <div className="absolute -bottom-7 left-4 sm:-bottom-10 sm:left-6">
                <div className="relative">
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                  {profile.isIdentityVerified && (
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-accent-green text-white shadow-sm" title="Identity Verified">
                      <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 pt-9 pb-4 sm:px-6 sm:pt-14 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-ink-800 flex flex-wrap items-center gap-2">
                    {profile.name}
                    {profile.isIdentityVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-3xs font-extrabold uppercase text-emerald-600 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified Identity
                      </span>
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-ink-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="self-start flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-ink-600 whitespace-pre-line">
                {profile.bio || 'No bio yet. Tell people about yourself!'}
              </p>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl bg-white border border-ink-100 shadow-card p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-800">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-ink-300 hover:text-ink-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <Input id="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Textarea id="bio" label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-11 rounded-lg border border-ink-200 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 h-11 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                    {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    Save changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Profile Photo Gallery */}
          <ProfilePhotoGallery profile={profile} onProfileUpdate={(updated) => setProfile(updated)} />

          {/* Identity Verification Status Card */}
          <IdentityVerificationCard user={profile} />

          {/* Trust Profile Card */}
          <div className="mb-6">
            <TrustProfileCard trustProfile={profile.trustProfile} score={profile.trustScore} />
          </div>


        </motion.div>
      </div>
    </Layout>
  );
}
