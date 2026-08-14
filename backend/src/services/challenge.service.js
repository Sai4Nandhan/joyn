import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Rating } from '../models/Rating.js';
import { createNotification } from './notification.service.js';

export const CHALLENGE_GROUPS = [
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Complete your initial onboarding steps to start connecting on JOYN.',
    challenges: [
      {
        id: 'complete_profile',
        title: 'Complete Your Profile',
        description: 'Add a bio and profile photo to introduce yourself to the community.',
        instructions: [
          'Go to your Profile settings',
          'Add a short bio describing your interests',
          'Upload a profile picture or avatar',
        ],
        cta: { label: 'Update Profile', to: '/profile' },
        badge: { id: 'first_explorer', label: 'First Explorer', icon: '🧭' },
        evaluator: async (user) => {
          const hasBio = Boolean(user.bio && user.bio.trim().length > 0);
          const hasPhoto = Boolean((user.avatarUrl && !user.avatarUrl.includes('dicebear')) || (user.profilePhotos && user.profilePhotos.length > 0));
          const current = (hasBio ? 1 : 0) + (hasPhoto ? 1 : 0);
          return { current, target: 2, isCompleted: current >= 2 };
        },
      },
      {
        id: 'verify_identity',
        title: 'Verify Your Account',
        description: 'Verify your email and phone number to boost community trust.',
        instructions: [
          'Verify your email address via OTP',
          'Verify your mobile phone number',
          'Earn verified member status',
        ],
        cta: { label: 'Verify Profile', to: '/profile' },
        badge: { id: 'verified_member', label: 'Verified Member', icon: '🛡️' },
        evaluator: async (user) => {
          const isVerified = Boolean(user.isIdentityVerified || user.verification?.status === 'VERIFIED' || (user.isEmailVerified && user.isPhoneVerified));
          return { current: isVerified ? 1 : 0, target: 1, isCompleted: isVerified };
        },
      },
      {
        id: 'join_first_activity',
        title: 'Request to Join an Activity',
        description: 'Find an activity in your city and request to join.',
        instructions: [
          'Browse Discover feed in your city',
          'Find an activity you like',
          'Submit a join request to the host',
        ],
        cta: { label: 'Find Activities', to: '/discover' },
        evaluator: async (user) => {
          const count = await JoinRequest.countDocuments({ requester: user._id, isDeleted: { $ne: true } });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
      {
        id: 'complete_first_activity',
        title: 'Complete Your First Activity',
        description: 'Attend and complete your first meetup or activity with JOYN members.',
        instructions: [
          'Get approved for an activity',
          'Meet up with the group in the real world',
          'Host completes the activity after meetup',
        ],
        cta: { label: 'Find Activities', to: '/discover' },
        badge: { id: 'reliable_participant', label: 'Reliable Participant', icon: '🎯' },
        evaluator: async (user) => {
          // Count approved requests for completed activities
          const approvedComp = await JoinRequest.countDocuments({
            requester: user._id,
            status: 'approved',
          });
          const compStats = user.stats?.completedActivities || 0;
          const current = Math.max(compStats, Math.min(1, approvedComp));
          return { current: Math.min(1, current), target: 1, isCompleted: current >= 1 };
        },
      },
      {
        id: 'rate_first_member',
        title: 'Rate Your First Member',
        description: 'Leave feedback for a participant or host after completing an activity.',
        instructions: [
          'Complete an activity',
          'Go to your My Activities section',
          'Submit a peer review/rating for your host or co-participants',
        ],
        cta: { label: 'Rate Participants', to: '/my-activities' },
        badge: { id: 'first_review', label: 'First Review', icon: '⭐' },
        evaluator: async (user) => {
          const count = await Rating.countDocuments({ rater: user._id });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
    ],
  },
  {
    id: 'hosting',
    title: 'First Host Milestones',
    description: 'Host events, welcome members, and build your hosting reputation.',
    challenges: [
      {
        id: 'create_first_activity',
        title: 'Create Your First Activity',
        description: 'Publish a new activity and invite people to join.',
        instructions: [
          'Click Create Activity',
          'Set activity title, category, and date/time',
          'Set your exact & approximate meeting points',
          'Publish to the community feed',
        ],
        cta: { label: 'Create Activity', to: '/activities/create' },
        evaluator: async (user) => {
          const count = await Activity.countDocuments({ host: user._id, isDeleted: { $ne: true } });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
      {
        id: 'first_approved_participant',
        title: 'Approve Your First Participant',
        description: 'Accept a join request for your hosted activity.',
        instructions: [
          'Check your activity join requests',
          'Review participant profile & trust score',
          'Approve their join request',
        ],
        cta: { label: 'View My Activities', to: '/my-activities' },
        evaluator: async (user) => {
          const count = await JoinRequest.countDocuments({ host: user._id, status: 'approved' });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
      {
        id: 'complete_first_hosted',
        title: 'Successfully Complete Hosted Activity',
        description: 'Host an activity through to successful completion.',
        instructions: [
          'Host the activity with approved members',
          'Go to Activity Room after meetup',
          'Click "Complete Activity" button',
        ],
        cta: { label: 'View My Activities', to: '/my-activities' },
        badge: { id: 'first_host', label: 'First Host', icon: '🏆' },
        evaluator: async (user) => {
          const count = await Activity.countDocuments({ host: user._id, status: 'completed', isDeleted: { $ne: true } });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
      {
        id: 'receive_host_feedback',
        title: 'Receive Participant Feedback',
        description: 'Receive legitimate ratings from attendees you hosted.',
        instructions: [
          'Host a memorable activity',
          'Ensure attendees have a great experience',
          'Receive positive review ratings from participants',
        ],
        cta: { label: 'View My Activities', to: '/my-activities' },
        badge: { id: 'great_host', label: 'Great Host', icon: '🌟' },
        evaluator: async (user) => {
          const count = await Rating.countDocuments({ ratee: user._id });
          return { current: Math.min(1, count), target: 1, isCompleted: count >= 1 };
        },
      },
    ],
  },
  {
    id: 'reliability',
    title: 'Reliability & Track Record',
    description: 'Build sustained reputation through consistent attendance and clean history.',
    challenges: [
      {
        id: 'complete_3_activities',
        title: 'Complete 3 Activities',
        description: 'Participate in and complete at least 3 activities.',
        instructions: [
          'Join or host 3 real-world activities',
          'Complete all 3 activities successfully',
        ],
        cta: { label: 'Find Activities', to: '/discover' },
        evaluator: async (user) => {
          const hosted = await Activity.countDocuments({ host: user._id, status: 'completed', isDeleted: { $ne: true } });
          const joined = await JoinRequest.countDocuments({ requester: user._id, status: 'approved' });
          const total = Math.max(user.stats?.completedActivities || 0, hosted + joined);
          return { current: Math.min(3, total), target: 3, isCompleted: total >= 3 };
        },
      },
      {
        id: 'maintain_perfect_attendance',
        title: '100% Attendance Record',
        description: 'Complete 3+ activities with zero no-shows or cancellations.',
        instructions: [
          'Maintain 100% attendance rate',
          'Zero no-shows or last-minute flaking',
        ],
        cta: { label: 'View Track Record', to: '/my-activities' },
        badge: { id: 'community_member', label: 'Community Member', icon: '🤝' },
        evaluator: async (user) => {
          const comp = user.stats?.completedActivities || 0;
          const noShows = user.stats?.noShows || 0;
          const cancellations = user.stats?.cancellations || 0;
          const isPerfect = comp >= 3 && noShows === 0 && cancellations === 0;
          return { current: isPerfect ? 3 : comp, target: 3, isCompleted: isPerfect };
        },
      },
      {
        id: 'distinct_independent_raters',
        title: 'Ratings from 3 Distinct Raters',
        description: 'Receive positive reviews from 3 separate community members.',
        instructions: [
          'Meet distinct JOYN members in different activities',
          'Receive reviews from 3 separate raters',
        ],
        cta: { label: 'Find Activities', to: '/discover' },
        badge: { id: 'trusted_peer', label: 'Trusted Peer', icon: '💎' },
        evaluator: async (user) => {
          const distinct = await Rating.find({ ratee: user._id }).distinct('rater');
          const count = distinct ? distinct.length : 0;
          return { current: Math.min(3, count), target: 3, isCompleted: count >= 3 };
        },
      },
      {
        id: 'community_contributor',
        title: 'Community Contributor',
        description: 'Submit 3 ratings for your peers to build community accountability.',
        instructions: [
          'Participate in group activities',
          'Submit feedback/ratings for 3 different participants',
        ],
        cta: { label: 'Rate Members', to: '/my-activities' },
        badge: { id: 'contributor', label: 'Contributor', icon: '✍️' },
        evaluator: async (user) => {
          const count = await Rating.countDocuments({ rater: user._id });
          return { current: Math.min(3, count), target: 3, isCompleted: count >= 3 };
        },
      },
    ],
  },
];

/**
 * Server-authoritative evaluation of user challenge progress & badges.
 * Automatically awards badges and sends completion notifications.
 */
export async function evaluateUserChallenges(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const existingBadges = new Set((user.unlockedBadges || []).map((b) => b.badgeId));
  const newBadgesToUnlock = [];
  const evaluatedGroups = [];

  let totalChallenges = 0;
  let completedCount = 0;

  for (const group of CHALLENGE_GROUPS) {
    const evaluatedChallenges = [];
    for (const ch of group.challenges) {
      totalChallenges++;
      const { current, target, isCompleted } = await ch.evaluator(user);
      if (isCompleted) completedCount++;

      let status = 'AVAILABLE';
      if (isCompleted) {
        status = 'COMPLETED';
      } else if (current > 0) {
        status = 'IN_PROGRESS';
      }

      if (isCompleted && ch.badge && !existingBadges.has(ch.badge.id)) {
        newBadgesToUnlock.push(ch.badge);
        existingBadges.add(ch.badge.id);
      }

      evaluatedChallenges.push({
        id: ch.id,
        title: ch.title,
        description: ch.description,
        instructions: ch.instructions || [],
        cta: ch.cta || { label: 'View Details', to: '/discover' },
        current,
        target,
        isCompleted,
        status,
        badge: ch.badge || null,
      });
    }

    evaluatedGroups.push({
      id: group.id,
      title: group.title,
      description: group.description,
      challenges: evaluatedChallenges,
    });
  }

  // Atomically persist newly unlocked badges & dispatch notifications
  if (newBadgesToUnlock.length > 0) {
    const now = new Date();
    const badgeDocs = newBadgesToUnlock.map((b) => ({ badgeId: b.id, unlockedAt: now }));

    await User.updateOne(
      { _id: userId },
      { $addToSet: { unlockedBadges: { $each: badgeDocs } } }
    );

    for (const b of newBadgesToUnlock) {
      await createNotification(userId, {
        type: 'success',
        title: '🎉 Challenge Unlocked!',
        content: `Congratulations! You unlocked the "${b.label}" badge (${b.icon}).`,
        link: '/challenges',
      });
    }
  }

  const completionPercentage = totalChallenges > 0 ? Math.round((completedCount / totalChallenges) * 100) : 0;
  const userLevel = completedCount >= 10 ? 'Level 3 — Master Host' : completedCount >= 5 ? 'Level 2 — Active Member' : 'Level 1 — Explorer';

  return {
    completionPercentage,
    userLevel,
    totalChallenges,
    completedCount,
    groups: evaluatedGroups,
    badges: Array.from(existingBadges),
  };
}
