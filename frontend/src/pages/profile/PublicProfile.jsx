import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Calendar, Award, Star, Heart, AlertTriangle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { getUserProfile } from '../../services/userService.js';
import { useAuth } from '../../hooks/useAuth.js';
import ReportModal from '../../components/ui/ReportModal.jsx';
import { TrustProfileCard } from '../../components/ui/TrustProfileCard.jsx';

import { getImageUrl } from '../../utils/imageUrl.js';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    getUserProfile(id)
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.message || 'Could not load this profile'));
  }, [id]);

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm font-medium text-brand-500 hover:text-brand-600">← Back</button>
        </div>
      </Layout>
    );
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
  const trustColor = trustScore >= 80 ? 'text-accent-green' : trustScore >= 50 ? 'text-accent-orange' : 'text-accent-red';

  return (
    <Layout>
      <div className="max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-brand-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* Profile Header Card */}
          <div className="rounded-2xl bg-white border border-ink-100 shadow-card overflow-hidden mb-6">
            <div className="h-28 bg-gradient-to-r from-brand-400 via-brand-300 to-accent-blue relative">
              <div className="absolute -bottom-10 left-6">
                <div className="relative">
                  <img src={avatarSrc} alt={profile.name} className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg" />
                  {profile.isIdentityVerified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-green text-white shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pt-14 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-ink-800">{profile.name}</h1>
                  <p className="text-sm text-ink-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-accent-red" />
                    <span className={`text-lg font-bold ${trustColor}`}>{trustScore}</span>
                  </div>
                  {user && user.id !== profile.id && (
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        to={`/messages?user=${profile.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        Message Member
                      </Link>
                      <button
                        onClick={() => setIsReportOpen(true)}
                        className="inline-flex items-center gap-1 text-2xs font-semibold text-ink-400 hover:text-red-500 transition-colors"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Report Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm text-ink-600 whitespace-pre-line">
                {profile.bio || 'No bio yet.'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <TrustProfileCard trustProfile={profile.trustProfile} score={profile.trustScore} />
          </div>

          {/* Ratings */}
          {profile.recentRatings?.length > 0 && (
            <div className="rounded-2xl bg-white border border-ink-100 shadow-card p-5">
              <h2 className="text-sm font-semibold text-ink-700 mb-4">Recent Feedback</h2>
              <div className="flex flex-col gap-3">
                {profile.recentRatings.map((r) => (
                  <div key={r.id} className="rounded-xl bg-ink-50 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-brand-500 text-sm tracking-wider">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                      <span className="text-xs text-ink-400">on {r.activity?.title}</span>
                    </div>
                    {r.comment && <p className="text-sm text-ink-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="user"
        targetId={profile.id}
        targetName={profile.name}
        targetUserId={profile.id}
      />
    </Layout>
  );
}
