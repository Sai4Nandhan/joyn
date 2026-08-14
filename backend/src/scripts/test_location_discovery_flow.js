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
  console.log('🧪 STAGING TEST: TWO-ACCOUNT REAL-WORLD LOCATION & DISCOVERY FLOW');
  console.log('==================================================');

  await connectDB();
  await Activity.syncIndexes();

  // Coordinates
  const WARANGAL = { lat: 17.9784, lng: 79.5941, placeName: 'Warangal, Telangana' };
  const HYDERABAD = { lat: 17.3850, lng: 78.4867, placeName: 'Hyderabad, Telangana' };

  // 1. Setup Account A (Host) & Account B (User)
  const hostEmail = `host_warangal_${Date.now()}@joyntest.com`;
  const userEmail = `user_warangal_${Date.now()}@joyntest.com`;

  const host = await User.create({
    name: 'Host A (Warangal)',
    email: hostEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
    trustScore: 95,
  });

  const participant = await User.create({
    name: 'User B (Warangal)',
    email: userEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
    trustScore: 90,
  });

  console.log(`\n✅ Account A created: ${host.name} (${host._id})`);
  console.log(`✅ Account B created: ${participant.name} (${participant._id})`);

  // 2. Host A creates Box Cricket Match in Warangal
  const startAt = new Date(Date.now() + 24 * 3600 * 1000);
  const endAt = new Date(startAt.getTime() + 3 * 3600 * 1000);

  const activityPayload = {
    title: 'Box Cricket Match - Warangal Turf',
    description: 'Weekend box cricket match with local enthusiasts in Warangal.',
    category: 'sports',
    schedule: { startAt, endAt },
    approxLocation: {
      placeName: WARANGAL.placeName,
      point: { type: 'Point', coordinates: [WARANGAL.lng, WARANGAL.lat] },
    },
    exactLocation: {
      address: 'Warangal Sports Complex, Hanamkonda Road',
      meetingPoint: 'Ground 2 Gate',
      point: { type: 'Point', coordinates: [WARANGAL.lng, WARANGAL.lat] },
    },
    capacity: { min: 4, max: 12 },
  };

  const activity = await activityService.createActivity(host._id, activityPayload);
  console.log(`\n✅ Activity Created by Host A:`);
  console.log(`   Title: ${activity.title}`);
  console.log(`   Location: ${activity.approxLocation.placeName}`);
  console.log(`   Coordinates (MongoDB GeoJSON [lng, lat]):`, activity.approxLocation.point.coordinates);

  // 3. User B in Warangal executes Activity Discovery
  console.log(`\n🔍 Account B (Warangal) executing Discovery Query...`);
  const discoveredWarangal = await activityService.discoverActivities({
    lat: WARANGAL.lat,
    lng: WARANGAL.lng,
    radiusKm: 50,
    page: 1,
    limit: 10,
  });

  const foundActivity = discoveredWarangal.find((a) => a.id.toString() === activity._id.toString());

  if (!foundActivity) {
    throw new Error('❌ FAILED: Account B in Warangal could NOT discover Account A\'s Warangal activity!');
  }

  console.log(`\n🎉 SUCCESS: Account B discovered Account A\'s activity!`);
  console.log(`   Found Activity ID: ${foundActivity.id}`);
  console.log(`   Distance Calculated: ${foundActivity.distanceMeters ? (foundActivity.distanceMeters / 1000).toFixed(2) + ' km' : 'N/A'}`);

  // 4. User B sends Join Request to Host A
  console.log(`\n📩 Account B sending Join Request to Host A...`);
  const joinReq = await joinRequestService.createJoinRequest(
    activity._id,
    participant._id,
    'Hey Host A, count me in for the cricket match!'
  );
  console.log(`   Join Request ID: ${joinReq.id}, Status: ${joinReq.status}`);

  // Check Host A notification
  const notifications = await Notification.find({ recipient: host._id });
  console.log(`   Host A received ${notifications.length} notification(s). Message: "${notifications[0]?.message}"`);

  // 5. Host A approves User B's Join Request
  console.log(`\n👍 Host A approving Account B's Join Request...`);
  const approvedReq = await joinRequestService.approveJoinRequest(joinReq.id, host._id);
  console.log(`   Updated Request Status: ${approvedReq.status}`);

  // 6. User B switches location to Hyderabad
  console.log(`\n🔄 Account B manually switches location to HYDERABAD (lat: 17.3850, lng: 78.4867, radius: 25km)...`);
  const discoveredHyd = await activityService.discoverActivities({
    lat: HYDERABAD.lat,
    lng: HYDERABAD.lng,
    radiusKm: 25,
    page: 1,
    limit: 10,
  });

  const foundInHyd = discoveredHyd.find((a) => a.id.toString() === activity._id.toString());
  if (foundInHyd) {
    throw new Error('❌ FAILED: Warangal activity should NOT appear when User B is in Hyderabad with 25km radius!');
  }
  console.log(`   ✅ Correct: Warangal activity is NOT visible from Hyderabad 25km radius (Distance ~140km > 25km).`);

  // 7. User B switches back to Warangal
  console.log(`\n🔄 Account B switches location back to WARANGAL...`);
  const rediscoveredWarangal = await activityService.discoverActivities({
    lat: WARANGAL.lat,
    lng: WARANGAL.lng,
    radiusKm: 50,
    page: 1,
    limit: 10,
  });
  const refoundActivity = rediscoveredWarangal.find((a) => a.id.toString() === activity._id.toString());
  if (!refoundActivity) {
    throw new Error('❌ FAILED: Warangal activity did not reappear after switching back to Warangal!');
  }
  console.log(`   ✅ Correct: Warangal activity reappeared upon switching back to Warangal!`);

  // Cleanup test data
  await Activity.deleteOne({ _id: activity._id });
  await User.deleteMany({ _id: { $in: [host._id, participant._id] } });
  await JoinRequest.deleteMany({ activity: activity._id });
  await Notification.deleteMany({ recipient: host._id });

  console.log('\n==================================================');
  console.log('🏆 END-TO-END LOCATION & DISCOVERY VERIFICATION PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ STAGING TEST ERROR:', err);
  process.exit(1);
});
