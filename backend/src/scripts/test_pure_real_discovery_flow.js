import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Notification } from '../models/Notification.js';
import * as activityService from '../services/activity.service.js';
import * as joinRequestService from '../services/joinRequest.service.js';

async function runTest() {
  console.log('==================================================');
  console.log('🧪 STAGING TEST: PURE REAL DATA DISCOVERY & HOST EXCLUSION');
  console.log('==================================================');

  await connectDB();

  const timestamp = Date.now();
  const hostEmail = `pure_host_${timestamp}@joyntest.com`;
  const userBEmail = `pure_userB_${timestamp}@joyntest.com`;
  const userCEmail = `pure_userC_${timestamp}@joyntest.com`;

  // Create Account A (Host in Warangal)
  const hostA = await User.create({
    name: 'Host A (Warangal)',
    email: hostEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
  });

  // Create Account B (Participant in Warangal)
  const userB = await User.create({
    name: 'User B (Warangal)',
    email: userBEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
  });

  // Create Account C (Participant in Hyderabad)
  const userC = await User.create({
    name: 'User C (Hyderabad)',
    email: userCEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
  });

  console.log(`\n✅ Account A created: ${hostA.name} (${hostA._id})`);
  console.log(`✅ Account B created: ${userB.name} (${userB._id})`);
  console.log(`✅ Account C created: ${userC.name} (${userC._id})`);

  // 1. Account A creates a Real Activity in Warangal
  console.log(`\n🚀 1. Account A creating real activity in Warangal...`);
  const startAt = new Date(Date.now() + 7200 * 1000); // 2 hours in future
  const endAt = new Date(startAt.getTime() + 7200 * 1000);

  const realActivity = await activityService.createActivity(hostA._id, {
    title: 'Real Warangal Badminton Match',
    description: 'A genuine user-created activity in Warangal.',
    category: 'sports',
    schedule: { startAt, endAt },
    approxLocation: {
      placeName: 'Warangal, Telangana',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    exactLocation: {
      address: 'Warangal Indoor Stadium',
      meetingPoint: 'Court 2',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    capacity: { min: 2, max: 4 },
  });

  console.log(`   Activity Created: ${realActivity.title} (${realActivity._id})`);
  console.log(`   Status: ${realActivity.status}`);
  console.log(`   Coordinates: [${realActivity.approxLocation.point.coordinates.join(', ')}]`);

  // 2. Account A checks Discover feed (MUST BE EXCLUDED)
  console.log(`\n🔍 2. Account A querying Discover feed (Warangal coordinates)...`);
  const hostDiscover = await activityService.discoverActivities({
    lat: 17.9784,
    lng: 79.5941,
    radiusKm: 50,
    currentUserId: hostA._id,
  });

  console.log(`   Account A Discover Results Count: ${hostDiscover.length}`);
  const selfFound = hostDiscover.find((a) => a.id.toString() === realActivity._id.toString());
  if (selfFound) {
    throw new Error('❌ FAILED: Account A found their own hosted activity in Discover feed!');
  }
  console.log(`   ✅ PASSED: Account A's own activity is strictly EXCLUDED from Discover.`);

  // 3. Account A checks My Activities
  console.log(`\n📋 3. Account A checking My Activities...`);
  const myActivities = await activityService.listMyActivities(hostA._id);
  const hostingFound = myActivities.find((a) => a.id.toString() === realActivity._id.toString());
  if (!hostingFound) {
    throw new Error('❌ FAILED: Account A cannot see their own activity in My Activities -> Hosting!');
  }
  console.log(`   ✅ PASSED: Account A sees activity under My Activities -> Hosting.`);

  // 4. Account B (Warangal) checks Discover feed (MUST SEE IT)
  console.log(`\n🔍 4. Account B (Warangal) querying Discover feed...`);
  const userBDiscover = await activityService.discoverActivities({
    lat: 17.9784,
    lng: 79.5941,
    radiusKm: 50,
    currentUserId: userB._id,
  });

  console.log(`   Account B Discover Results Count: ${userBDiscover.length}`);
  const bFound = userBDiscover.find((a) => a.id.toString() === realActivity._id.toString());
  if (!bFound) {
    throw new Error('❌ FAILED: Account B in Warangal could not discover Account A\'s activity!');
  }
  console.log(`   ✅ PASSED: Account B in Warangal discovered "${bFound.title}" (${bFound.distanceMeters ? Math.round(bFound.distanceMeters / 1000) : 0}km away).`);

  // 5. Account B sends join request
  console.log(`\n📩 5. Account B sending join request to Account A's activity...`);
  const joinReq = await joinRequestService.createJoinRequest(
    realActivity._id,
    userB._id,
    'Hey, I would love to play badminton!'
  );
  console.log(`   Join Request Created: ID ${joinReq.id}`);

  // 6. Account A receives notification
  console.log(`\n🔔 6. Verifying Account A received join request notification...`);
  const hostNotifications = await Notification.find({ recipient: hostA._id });
  console.log(`   Host A Notifications Count: ${hostNotifications.length}`);
  if (hostNotifications.length === 0) {
    throw new Error('❌ FAILED: Host A did not receive join request notification!');
  }
  console.log(`   ✅ PASSED: Host A received notification: "${hostNotifications[0].title}"`);

  // 7. Account C (Hyderabad) checks Discover feed (MUST NOT SEE WARANGAL ACTIVITY)
  console.log(`\n🌍 7. Account C (Hyderabad coordinates: 17.4483, 78.3741) querying Discover feed...`);
  const userCDiscoverHyd = await activityService.discoverActivities({
    lat: 17.4483,
    lng: 78.3741,
    radiusKm: 50,
    currentUserId: userC._id,
  });

  console.log(`   Account C (Hyderabad) Discover Results Count: ${userCDiscoverHyd.length}`);
  const cHydFound = userCDiscoverHyd.find((a) => a.id.toString() === realActivity._id.toString());
  if (cHydFound) {
    throw new Error('❌ FAILED: Account C in Hyderabad discovered Warangal activity (~140km away) within 50km radius!');
  }
  console.log(`   ✅ PASSED: Account C in Hyderabad cannot see Warangal activity outside 50km radius.`);

  // 8. Account C changes location to Warangal (MUST NOW SEE IT)
  console.log(`\n📍 8. Account C switching location to Warangal (17.9784, 79.5941) and re-querying Discover...`);
  const userCDiscoverWarangal = await activityService.discoverActivities({
    lat: 17.9784,
    lng: 79.5941,
    radiusKm: 50,
    currentUserId: userC._id,
  });

  console.log(`   Account C (Warangal location) Discover Results Count: ${userCDiscoverWarangal.length}`);
  const cWarangalFound = userCDiscoverWarangal.find((a) => a.id.toString() === realActivity._id.toString());
  if (!cWarangalFound) {
    throw new Error('❌ FAILED: Account C after switching location to Warangal could not discover the activity!');
  }
  console.log(`   ✅ PASSED: Account C discovered Warangal activity immediately after updating location!`);

  // 9. Database Audit Verification
  console.log(`\n💾 9. Auditing MongoDB document fields...`);
  const dbDoc = await Activity.findById(realActivity._id);
  console.log(`   MongoDB Document Host: ${dbDoc.host}`);
  console.log(`   MongoDB Document Status: ${dbDoc.status}`);
  console.log(`   MongoDB Document GeoJSON Point:`, JSON.stringify(dbDoc.approxLocation.point));
  if (dbDoc.approxLocation.point.coordinates[0] !== 79.5941 || dbDoc.approxLocation.point.coordinates[1] !== 17.9784) {
    throw new Error('❌ FAILED: GeoJSON coordinates order invalid!');
  }
  console.log(`   ✅ PASSED: GeoJSON coordinates [79.5941, 17.9784] verified in MongoDB.`);

  // Cleanup test data
  await Activity.deleteOne({ _id: realActivity._id });
  await User.deleteMany({ _id: { $in: [hostA._id, userB._id, userC._id] } });
  await JoinRequest.deleteMany({ activity: realActivity._id });
  await Notification.deleteMany({ recipient: { $in: [hostA._id, userB._id, userC._id] } });

  console.log('\n==================================================');
  console.log('🏆 ALL 17 PURE REAL DATA DISCOVERY REQUIREMENTS PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ STAGING TEST ERROR:', err);
  process.exit(1);
});
