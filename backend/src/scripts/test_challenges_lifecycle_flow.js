import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Rating } from '../models/Rating.js';
import { Notification } from '../models/Notification.js';
import * as activityService from '../services/activity.service.js';
import * as joinRequestService from '../services/joinRequest.service.js';
import * as ratingService from '../services/rating.service.js';
import { evaluateUserChallenges } from '../services/challenge.service.js';

async function runTest() {
  console.log('==================================================');
  console.log('🧪 STAGING TEST: END-TO-END CHALLENGES LIFECYCLE ENGINE');
  console.log('==================================================');

  await connectDB();

  // 1. Setup fresh Account A (Host) & Account B (User B)
  const hostEmail = `challenge_host_${Date.now()}@joyntest.com`;
  const userEmail = `challenge_user_${Date.now()}@joyntest.com`;

  const host = await User.create({
    name: 'Host A (Challenge Tester)',
    email: hostEmail,
    bio: 'Avid sports host in Warangal',
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
    trustScore: 90,
  });

  const participant = await User.create({
    name: 'User B (Challenge Tester)',
    email: userEmail,
    bio: 'Cricket fan looking for local matches',
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
    trustScore: 85,
  });

  console.log(`\n✅ Account A created: ${host.name} (${host._id})`);
  console.log(`✅ Account B created: ${participant.name} (${participant._id})`);

  // Initial Challenge Evaluation
  const initialHostEval = await evaluateUserChallenges(host._id);
  const initialUserEval = await evaluateUserChallenges(participant._id);

  console.log(`\n📊 Initial Challenge Completion:`);
  console.log(`   Host A: ${initialHostEval.completedCount}/${initialHostEval.totalChallenges} (${initialHostEval.completionPercentage}%)`);
  console.log(`   User B: ${initialUserEval.completedCount}/${initialUserEval.totalChallenges} (${initialUserEval.completionPercentage}%)`);

  // 2. Account A publishes an Activity
  console.log(`\n🚀 Account A creating an activity...`);
  const startAt = new Date(Date.now() + 3600 * 1000); // 1 hour in future
  const endAt = new Date(startAt.getTime() + 3600 * 1000);

  const activity = await activityService.createActivity(host._id, {
    title: 'Functional Challenge Cricket Match',
    description: 'Testing functional challenge progression on real activity lifecycle.',
    category: 'sports',
    schedule: { startAt, endAt },
    approxLocation: {
      placeName: 'Warangal, Telangana',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    exactLocation: {
      address: 'Warangal Sports Club',
      meetingPoint: 'Gate 1',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    capacity: { min: 2, max: 10 },
  });

  await evaluateUserChallenges(host._id);

  const evalAfterCreate = await evaluateUserChallenges(host._id);
  const createCh = evalAfterCreate.groups[1].challenges.find((c) => c.id === 'create_first_activity');
  console.log(`   Host Challenge [create_first_activity]: ${createCh.current}/${createCh.target} (Status: ${createCh.status})`);
  if (!createCh.isCompleted) throw new Error('❌ FAILED: create_first_activity should be COMPLETED!');

  // 3. Account B requests to join & Host A approves
  console.log(`\n📩 Account B requesting to join & Host A approving...`);
  const joinReq = await joinRequestService.createJoinRequest(
    activity._id,
    participant._id,
    'I want to play!'
  );
  await joinRequestService.approveJoinRequest(joinReq.id, host._id);

  const evalAfterApprove = await evaluateUserChallenges(host._id);
  const approveCh = evalAfterApprove.groups[1].challenges.find((c) => c.id === 'first_approved_participant');
  console.log(`   Host Challenge [first_approved_participant]: ${approveCh.current}/${approveCh.target} (Status: ${approveCh.status})`);
  if (!approveCh.isCompleted) throw new Error('❌ FAILED: first_approved_participant should be COMPLETED!');

  // 4. Host A completes the activity
  console.log(`\n🏁 Host A marking activity as COMPLETED...`);
  await Activity.updateOne({ _id: activity._id }, { 'schedule.endAt': new Date(Date.now() - 1000) });
  await activityService.completeActivity(activity._id, host._id);

  const evalHostComp = await evaluateUserChallenges(host._id);
  const evalUserComp = await evaluateUserChallenges(participant._id);

  const hostCompCh = evalHostComp.groups[1].challenges.find((c) => c.id === 'complete_first_hosted');
  const userCompCh = evalUserComp.groups[0].challenges.find((c) => c.id === 'complete_first_activity');

  console.log(`   Host Challenge [complete_first_hosted]: ${hostCompCh.current}/${hostCompCh.target} (Status: ${hostCompCh.status}, Badge: ${hostCompCh.badge?.label})`);
  console.log(`   User B Challenge [complete_first_activity]: ${userCompCh.current}/${userCompCh.target} (Status: ${userCompCh.status}, Badge: ${userCompCh.badge?.label})`);

  if (!hostCompCh.isCompleted) throw new Error('❌ FAILED: complete_first_hosted should be COMPLETED!');
  if (!userCompCh.isCompleted) throw new Error('❌ FAILED: complete_first_activity should be COMPLETED!');

  // 5. Account B rates Account A
  console.log(`\n⭐ Account B submitting 5-star rating for Host A...`);
  await ratingService.createRating(activity._id, participant._id, {
    rateeId: host._id,
    stars: 5,
    comment: 'Awesome host!',
    behavioralFeedback: { reliable: true, onTime: true, respectful: true },
  });

  const evalHostRating = await evaluateUserChallenges(host._id);
  const evalUserRating = await evaluateUserChallenges(participant._id);

  const userRateCh = evalUserRating.groups[0].challenges.find((c) => c.id === 'rate_first_member');
  const hostRecCh = evalHostRating.groups[1].challenges.find((c) => c.id === 'receive_host_feedback');

  console.log(`   User B Challenge [rate_first_member]: ${userRateCh.current}/${userRateCh.target} (Status: ${userRateCh.status}, Badge: ${userRateCh.badge?.label})`);
  console.log(`   Host A Challenge [receive_host_feedback]: ${hostRecCh.current}/${hostRecCh.target} (Status: ${hostRecCh.status}, Badge: ${hostRecCh.badge?.label})`);

  if (!userRateCh.isCompleted) throw new Error('❌ FAILED: rate_first_member should be COMPLETED!');
  if (!hostRecCh.isCompleted) throw new Error('❌ FAILED: receive_host_feedback should be COMPLETED!');

  // 6. Verify MongoDB persistence of badges & notifications
  console.log(`\n🔍 Verifying MongoDB Unlocked Badges & Notifications...`);
  const finalHostDoc = await User.findById(host._id);
  const finalUserDoc = await User.findById(participant._id);

  console.log(`   Host A Unlocked Badges:`, (finalHostDoc.unlockedBadges || []).map((b) => b.badgeId));
  console.log(`   User B Unlocked Badges:`, (finalUserDoc.unlockedBadges || []).map((b) => b.badgeId));

  const hostNotifications = await Notification.find({ recipient: host._id, title: /Challenge Unlocked/ });
  const userNotifications = await Notification.find({ recipient: participant._id, title: /Challenge Unlocked/ });

  console.log(`   Host A Unlocked Notifications Count: ${hostNotifications.length}`);
  console.log(`   User B Unlocked Notifications Count: ${userNotifications.length}`);

  if ((finalHostDoc.unlockedBadges || []).length === 0 || (finalUserDoc.unlockedBadges || []).length === 0) {
    throw new Error('❌ FAILED: Badges were not persisted to MongoDB!');
  }

  // Cleanup test data
  await Activity.deleteOne({ _id: activity._id });
  await User.deleteMany({ _id: { $in: [host._id, participant._id] } });
  await JoinRequest.deleteMany({ activity: activity._id });
  await Rating.deleteMany({ activity: activity._id });
  await Notification.deleteMany({ recipient: { $in: [host._id, participant._id] } });

  console.log('\n==================================================');
  console.log('🏆 END-TO-END CHALLENGES LIFECYCLE VERIFICATION PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ STAGING TEST ERROR:', err);
  process.exit(1);
});
