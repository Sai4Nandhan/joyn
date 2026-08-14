const BADGE_DEFINITIONS = [
  {
    id: 'identity_verified',
    label: 'Verified Member',
    description: 'Identity verified',
    check: (u) => u.isIdentityVerified,
  },
  {
    id: 'reliable_member',
    label: 'Reliable Member',
    description: 'Consistently completes activities with high attendance',
    check: (u) => {
      const comp = u.stats?.completedActivities || 0;
      const noShow = u.stats?.noShows || 0;
      const cancel = u.stats?.cancellations || 0;
      const total = comp + noShow + cancel;
      const attendance = total > 0 ? (comp / total) : 1.0;
      return comp >= 10 && attendance >= 0.9;
    },
  },
  {
    id: 'always_on_time',
    label: 'Always On Time',
    description: 'Strong punctuality history with no no-shows',
    check: (u) => {
      const ratingCount = u.stats?.ratingCount || 0;
      const onTimeSum = u.stats?.onTimeSum || 0;
      const comp = u.stats?.completedActivities || 0;
      const noShow = u.stats?.noShows || 0;
      const pct = ratingCount > 0 ? (onTimeSum / ratingCount) : 1.0;
      return comp >= 5 && noShow === 0 && pct >= 0.9;
    },
  },
  {
    id: 'trusted_traveller',
    label: 'Trusted Traveller',
    description: 'Completed 3+ trips, travels, or trekking activities',
    check: (u) => (u.stats?.completedTrips || 0) >= 3,
  },
  {
    id: 'great_organizer',
    label: 'Great Organizer',
    description: 'Hosted 5+ successful activities with zero cancellations',
    check: (u) => (u.stats?.activitiesHosted || 0) >= 5 && (u.stats?.cancellations || 0) === 0,
  },
  {
    id: 'community_favorite',
    label: 'Community Favorite',
    description: 'Consistently strong community feedback (4.7+ stars)',
    check: (u) => (u.stats?.ratingCount || 0) >= 5 && (u.stats?.ratingSum / u.stats?.ratingCount) >= 4.7,
  },
  {
    id: 'sports_enthusiast',
    label: 'Sports Enthusiast',
    description: 'Completed 5+ sports activities',
    check: (u) => (u.stats?.completedSports || 0) >= 5,
  },
];

export function computeBadges(user) {
  return BADGE_DEFINITIONS.filter((b) => b.check(user)).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}
