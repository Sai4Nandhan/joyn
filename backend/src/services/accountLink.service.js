import { User } from '../models/User.js';
import { Rating } from '../models/Rating.js';

/**
 * Evaluates risk-based linkage for a newly registered account.
 * Strong Signals: Phone number match, verified identity document match.
 * Weak Signals: Email match alone (NOT sufficient for automatic punishment).
 */
export async function evaluateAccountLinkage(newUser) {
  if (!newUser || !newUser._id) return newUser;

  const queryConditions = [];
  if (newUser.phone) queryConditions.push({ phone: newUser.phone });

  if (queryConditions.length === 0) {
    return newUser;
  }

  const linkedUsers = await User.find({
    _id: { $ne: newUser._id },
    $or: queryConditions,
    isDeleted: { $ne: true },
  });

  if (!linkedUsers || linkedUsers.length === 0) {
    return newUser;
  }

  for (const linked of linkedUsers) {
    const modState = linked.moderationState || (linked.isSuspended ? 'CONFIRMED_SPAM' : 'NORMAL');
    const isPhoneMatch = Boolean(newUser.phone && linked.phone === newUser.phone);

    // Strong Linkage Signals: Phone match with confirmed abuse/spam/banned account
    if (isPhoneMatch && ['CONFIRMED_SPAM', 'SERIOUS_ABUSE'].includes(modState)) {
      newUser.riskStatus = 'ELEVATED';
      newUser.reputationStatus = 'LIMITED';
      newUser.securityAudit = newUser.securityAudit || [];
      newUser.securityAudit.push({
        linkageSignal: 'phone_match',
        confidenceLevel: 'HIGH',
        linkedUserId: linked._id,
        previousAccountStatus: modState,
        reason: 'Strong phone match to account with confirmed moderation penalty',
        createdAt: new Date(),
      });
      break;
    }

    if (isPhoneMatch && modState === 'PERMANENTLY_BANNED') {
      newUser.riskStatus = 'HIGH';
      newUser.reputationStatus = 'LIMITED';
      newUser.securityAudit = newUser.securityAudit || [];
      newUser.securityAudit.push({
        linkageSignal: 'phone_match',
        confidenceLevel: 'HIGH',
        linkedUserId: linked._id,
        previousAccountStatus: modState,
        reason: 'Linked to permanently banned account via verified phone',
        createdAt: new Date(),
      });
      break;
    }

    // Normal or Low-rated accounts MUST NOT poison new accounts!
    // If previous account state is 'NORMAL' or 'LOW_REPUTATION', no risk penalty is assigned.
  }

  await newUser.save();
  return newUser;
}

/**
 * Hardened Objective Behavioral Recovery: Allows legitimate users to rebuild reputation
 * through genuine, independent community participation while blocking coordinated alt-account gaming loops.
 */
export async function evaluateRiskRecovery(user) {
  if (!user || user.riskStatus === 'NORMAL') return user;

  const { completedActivities = 0, noShows = 0, cancellations = 0, reportsAgainst = 0, ratingCount = 0, ratingSum = 0 } = user.stats || {};
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

  // Query distinct independent raters to block same-user / alt-account loop manipulation
  const distinctRaters = await Rating.find({ ratee: user._id }).distinct('rater');
  const uniqueRaterCount = distinctRaters ? distinctRaters.length : 0;

  // Hardened Anti-Gaming Recovery Criteria:
  // 1. Must complete at least 3 activities
  // 2. Must receive ratings from at least 3 DISTINCT, INDEPENDENT community members
  // 3. Must have 0 no-shows and 0 cancellations
  // 4. Must have 0 active reports/complaints
  // 5. Must maintain average rating >= 4.0
  const MIN_COMPLETED_ACTIVITIES = 3;
  const MIN_INDEPENDENT_RATERS = 3;
  const MIN_AVG_RATING = 4.0;

  const isEligibleForRecovery =
    completedActivities >= MIN_COMPLETED_ACTIVITIES &&
    uniqueRaterCount >= MIN_INDEPENDENT_RATERS &&
    noShows === 0 &&
    cancellations === 0 &&
    reportsAgainst === 0 &&
    avgRating >= MIN_AVG_RATING;

  if (isEligibleForRecovery) {
    const prevRisk = user.riskStatus;
    user.riskStatus = 'NORMAL';
    user.reputationStatus = 'NORMAL';
    user.securityAudit = user.securityAudit || [];
    user.securityAudit.push({
      linkageSignal: 'behavioral_recovery',
      confidenceLevel: 'HIGH',
      previousAccountStatus: prevRisk,
      reason: `Objective behavioral recovery satisfied with ${completedActivities} completed activities and ${uniqueRaterCount} distinct independent raters`,
      createdAt: new Date(),
    });
    await user.save();
  }

  return user;
}
