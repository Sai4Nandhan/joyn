import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { computeBadges } from './badges.service.js';
import { listRatingsReceived } from './rating.service.js';
import { escapeRegex } from '../utils/sanitize.js';

export function calculateTrustStats(user) {
  const comp = user.stats?.completedActivities || 0;
  const noShow = user.stats?.noShows || 0;
  const cancel = user.stats?.cancellations || 0;
  const totalCommitments = comp + noShow + cancel;

  const attendanceRate = totalCommitments > 0 ? Math.round((comp / totalCommitments) * 100) : 100;
  const noShowRate = totalCommitments > 0 ? Math.round((noShow / totalCommitments) * 100) : 0;
  const cancellationRate = totalCommitments > 0 ? Math.round((cancel / totalCommitments) * 100) : 0;

  const ratingCount = user.stats?.ratingCount || 0;
  const ratingSum = user.stats?.ratingSum || 0;
  const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;

  const hosted = user.stats?.activitiesHosted || 0;
  const hostCompletionRate = hosted > 0 ? Math.round(((hosted - cancel) / hosted) * 100) : 100;

  // Behavioral satisfaction rates
  const reliableSum = user.stats?.reliableSum || 0;
  const onTimeSum = user.stats?.onTimeSum || 0;
  const respectfulSum = user.stats?.respectfulSum || 0;
  const goodCommunicationSum = user.stats?.goodCommunicationSum || 0;
  const matchedExpectationsSum = user.stats?.matchedExpectationsSum || 0;

  const reliabilityScore = ratingCount > 0 ? Math.round((reliableSum / ratingCount) * 100) : 0;
  const punctualityScore = ratingCount > 0 ? Math.round((onTimeSum / ratingCount) * 100) : 0;
  const communicationScore = ratingCount > 0 ? Math.round((goodCommunicationSum / ratingCount) * 100) : 0;
  const respectScore = ratingCount > 0 ? Math.round((respectfulSum / ratingCount) * 100) : 0;
  const satisfactionScore = ratingCount > 0 ? Math.round((matchedExpectationsSum / ratingCount) * 100) : 0;

  const accountAgeDays = user.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  let accountAge;
  if (accountAgeDays < 1) {
    accountAge = 'Just joined';
  } else if (accountAgeDays < 30) {
    accountAge = `${accountAgeDays} day${accountAgeDays !== 1 ? 's' : ''}`;
  } else if (accountAgeDays < 365) {
    const months = Math.floor(accountAgeDays / 30);
    accountAge = `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(accountAgeDays / 365);
    const remainingMonths = Math.floor((accountAgeDays % 365) / 30);
    accountAge = remainingMonths > 0
      ? `${years}y ${remainingMonths}mo`
      : `${years} year${years !== 1 ? 's' : ''}`;
  }

  // Milestones Timeline
  const timeline = [
    { title: 'Joined JOYN', description: 'Started community profile' },
  ];
  if (comp >= 1) {
    timeline.push({ title: 'Completed First Activity', description: 'Successfully attended first plan' });
  }
  if (comp >= 5) {
    timeline.push({ title: 'Active Participant', description: 'Completed 5+ activities' });
  }
  if (hosted >= 1) {
    timeline.push({ title: 'Hosted First Activity', description: 'Organized first community plan' });
  }
  if (comp >= 25) {
    timeline.push({ title: 'Veteran Member', description: 'Successfully completed 25+ activities' });
  }

  const badges = computeBadges(user);
  badges.forEach((b) => {
    timeline.push({ title: `Earned ${b.label}`, description: b.description });
  });

  return {
    identityVerified: user.isIdentityVerified,
    completedActivities: comp,
    activitiesHosted: hosted,
    attendanceRate,
    noShowRate,
    cancellationRate,
    communityReputation: avgRating,
    hostReliability: hostCompletionRate,
    accountAge,
    reportsCount: user.stats?.reportsAgainst || 0,
    behavioralScores: {
      reliability: reliabilityScore,
      punctuality: punctualityScore,
      communication: communicationScore,
      respect: respectScore,
      hosting: satisfactionScore,
    },
    timeline,
    badges,
  };
}

export async function getPublicProfile(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const [ratings] = await Promise.all([listRatingsReceived(userId)]);
  const trustProfile = calculateTrustStats(user);

  return {
    ...user.toPublicProfileJSON(),
    trustProfile,
    recentRatings: ratings.map((r) => ({
      id: r.id,
      stars: r.stars,
      comment: r.comment,
      rater: r.rater,
      activity: r.activity,
      createdAt: r.createdAt,
    })),
  };
}

export async function updateProfile(userId, { name, bio, avatarUrl, settings, hasCompletedOnboarding }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new ApiError(400, 'Name must be at least 2 characters long');
    }
    const safeName = escapeRegex(trimmedName);
    const existingName = await User.findOne({
      _id: { $ne: userId },
      name: { $regex: `^${safeName}$`, $options: 'i' },
      isDeleted: { $ne: true },
    });
    if (existingName) {
      throw new ApiError(409, 'This name is already taken by another member');
    }
    user.name = trimmedName;
  }
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (hasCompletedOnboarding !== undefined) user.hasCompletedOnboarding = Boolean(hasCompletedOnboarding);

  if (settings !== undefined) {
    user.settings = {
      ...(user.settings ? user.settings.toObject?.() || user.settings : {}),
      ...settings,
    };
  }

  await user.save();
  return user.toSafeJSON();
}

export async function saveActivity(userId, activityId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const actIdStr = activityId.toString();
  if (!user.savedActivities.some((id) => id.toString() === actIdStr)) {
    user.savedActivities.push(activityId);
    await user.save();
  }
  return user.toSafeJSON();
}

export async function unsaveActivity(userId, activityId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  user.savedActivities = user.savedActivities.filter(
    (id) => id.toString() !== activityId.toString()
  );
  await user.save();
  return user.toSafeJSON();
}

export async function listSavedActivities(userId) {
  const user = await User.findById(userId).populate({
    path: 'savedActivities',
    populate: {
      path: 'host',
      select: 'name avatarUrl trustScore isIdentityVerified',
    },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  // Filter out any null/deleted activities
  const validSaved = user.savedActivities.filter(a => a != null && !a.isDeleted);
  return validSaved.map((a) => a.toPublicJSON(true));
}

export async function listPublicUsers({ search, excludeUserId }) {
  const filter = { isDeleted: { $ne: true }, isSuspended: { $ne: true } };
  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }
  if (search) {
    const safeSearch = escapeRegex(search);
    if (safeSearch) {
      filter.name = { $regex: safeSearch, $options: 'i' };
    }
  }

  const users = await User.find(filter).sort({ name: 1 }).limit(100);
  return users.map((u) => u.toSafeJSON());
}
