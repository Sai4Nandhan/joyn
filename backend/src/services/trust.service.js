import { User } from '../models/User.js';
import { evaluateRiskRecovery } from './accountLink.service.js';

// Bayesian-style prior: a brand-new user is assumed reasonably reliable
// (PRIOR_SUCCESSES out of PRIOR_TOTAL "virtual" completions). This is what
// keeps one early cancellation or no-show from tanking the score, and keeps
// smoothing behavior consistent as real history accumulates.
const PRIOR_SUCCESSES = 4;
const PRIOR_TOTAL = 5;

const RELIABILITY_WEIGHT = 65; // max points from the reliability track record
const RATING_WEIGHT = 15; // max points from community feedback (ratings)
const BASELINE = 10; // everyone starts with this floor
const IDENTITY_BONUS = 5; // verified identity
const MAX_ACCOUNT_AGE_BONUS = 5; // longevity, capped
const ACCOUNT_AGE_BONUS_FULL_YEARS = 1; // years of tenure to earn the full bonus
const NO_SHOW_WEIGHT_IN_DENOMINATOR = 2; // no-shows hurt the reliability rate more than cancellations
const REPORT_PENALTY_PER_REPORT = 5;
const MAX_REPORT_PENALTY = 30;

// Same smoothing philosophy as reliability: a new user with zero ratings is
// assumed to be an average 4/5 until real feedback accumulates, so the first
// rating (good or bad) only nudges the score instead of swinging it.
const PRIOR_RATING_AVG = 4;
const PRIOR_RATING_COUNT = 3;

export function computeTrustScore(user) {
  const {
    completedActivities = 0,
    cancellations = 0,
    noShows = 0,
    reportsAgainst = 0,
    ratingSum = 0,
    ratingCount = 0,
  } = user.stats || {};

  const totalCommitments = completedActivities + cancellations + noShows * NO_SHOW_WEIGHT_IN_DENOMINATOR;

  // Smoothed reliability rate: (successes + prior) / (attempts + prior total).
  // A single bad outcome barely moves this once there's any history, and even
  // with zero history it lands at PRIOR_SUCCESSES / PRIOR_TOTAL, not 0.
  const smoothedReliability = (completedActivities + PRIOR_SUCCESSES) / (totalCommitments + PRIOR_TOTAL);

  // Smoothed average rating (1-5 scale), Bayesian-blended with a neutral prior.
  const smoothedRating =
    (ratingSum + PRIOR_RATING_AVG * PRIOR_RATING_COUNT) / (ratingCount + PRIOR_RATING_COUNT);
  const ratingFactor = Math.max(0, Math.min(1, (smoothedRating - 1) / 4));

  const accountAgeDays = user.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  const accountAgeBonus = Math.min(
    (accountAgeDays / (365 * ACCOUNT_AGE_BONUS_FULL_YEARS)) * MAX_ACCOUNT_AGE_BONUS,
    MAX_ACCOUNT_AGE_BONUS
  );

  const isVerified = !!(user.isIdentityVerified || user.verification?.status === 'VERIFIED');
  const identityBonus = isVerified ? IDENTITY_BONUS : 0;

  const reportPenalty = Math.min(reportsAgainst * REPORT_PENALTY_PER_REPORT, MAX_REPORT_PENALTY);

  const raw =
    BASELINE +
    smoothedReliability * RELIABILITY_WEIGHT +
    ratingFactor * RATING_WEIGHT +
    identityBonus +
    accountAgeBonus -
    reportPenalty;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

export async function recalculateTrustScore(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  user.trustScore = computeTrustScore(user);
  await evaluateRiskRecovery(user);
  await user.save();
  return user;
}
