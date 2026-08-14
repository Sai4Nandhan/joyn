import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import * as activityService from '../services/activity.service.js';
import * as joinRequestService from '../services/joinRequest.service.js';
import * as roomService from '../services/room.service.js';

async function runTest() {
  console.log('==================================================');
  console.log('🧪 STAGING TEST: ACTIVITY ROOM MESSAGING, VOICE & NOTIFICATIONS');
  console.log('==================================================');

  await connectDB();

  const timestamp = Date.now();
  const hostEmail = `room_host_${timestamp}@joyntest.com`;
  const userEmail = `room_user_${timestamp}@joyntest.com`;

  // 1. Create Account A (Host) & Account B (Participant)
  const host = await User.create({
    name: 'Host A (Room Tester)',
    email: hostEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
  });

  const participant = await User.create({
    name: 'User B (Room Tester)',
    email: userEmail,
    passwordHash: 'hashed_test_pass',
    isEmailVerified: true,
  });

  console.log(`\n✅ Account A created: ${host.name} (${host._id})`);
  console.log(`✅ Account B created: ${participant.name} (${participant._id})`);

  // 2. Host A creates activity & approves Participant B
  const startAt = new Date(Date.now() + 3600 * 1000);
  const endAt = new Date(startAt.getTime() + 3600 * 1000);

  const activity = await activityService.createActivity(host._id, {
    title: 'Room Messaging Test Activity',
    description: 'Testing room notifications, mute state, and voice messages.',
    category: 'sports',
    schedule: { startAt, endAt },
    approxLocation: {
      placeName: 'Warangal, Telangana',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    exactLocation: {
      address: 'Warangal Sports Ground',
      meetingPoint: 'Gate 1',
      point: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    capacity: { min: 2, max: 10 },
  });

  const joinReq = await joinRequestService.createJoinRequest(activity._id, participant._id, 'Can I join?');
  await joinRequestService.approveJoinRequest(joinReq.id, host._id);
  console.log(`\n🚀 Activity created & Participant B approved.`);

  // Clear onboarding/join notifications for clean counting
  await Notification.deleteMany({ recipient: host._id });

  // 3. Text Message & Notification Test
  console.log(`\n💬 3. Participant B sending text message in Activity Room...`);
  const msg1 = await roomService.createMessage(activity._id, participant._id, {
    content: 'Hello everyone in the Activity Room!',
    type: 'message',
  });

  console.log(`   Message Persisted in MongoDB: ID ${msg1.id}`);
  const notifsAfterMsg1 = await Notification.find({ user: host._id, link: `/activities/${activity._id}/room` });
  console.log(`   Host A Room Message Notifications Count: ${notifsAfterMsg1.length}`);
  if (notifsAfterMsg1.length === 0) {
    throw new Error('❌ FAILED: Host A did not receive room message notification!');
  }
  console.log(`   ✅ PASSED: Host A received room message notification: "${notifsAfterMsg1[0].title}"`);

  // 4. Voice Message Test
  console.log(`\n🎙️ 4. Participant B sending Voice Message...`);
  const voiceMsg = await roomService.createMessage(activity._id, participant._id, {
    content: '🎙️ Voice Message',
    type: 'voice',
    voiceUrl: '/uploads/voice/test_sample.webm',
    duration: 6,
    mimeType: 'audio/webm',
    fileSize: 45000,
  });

  console.log(`   Voice Message MongoDB Metadata:`, {
    type: voiceMsg.type,
    voiceUrl: voiceMsg.voiceUrl,
    duration: voiceMsg.duration,
  });

  if (voiceMsg.type !== 'voice' || !voiceMsg.voiceUrl) {
    throw new Error('❌ FAILED: Voice message metadata missing or invalid!');
  }
  console.log(`   ✅ PASSED: Voice message persisted in MongoDB with playable URL and duration.`);

  // 5. Per-Room Mute Test
  console.log(`\n🔕 5. Host A muting the Activity Room...`);
  await roomService.toggleMuteRoom(host._id, activity._id);

  const notifCountBeforeMutedMsg = (await Notification.find({ user: host._id })).length;

  await roomService.createMessage(activity._id, participant._id, {
    content: 'Testing muted room message suppression',
    type: 'message',
  });

  const notifCountAfterMutedMsg = (await Notification.find({ user: host._id })).length;
  console.log(`   Notifications count before muted msg: ${notifCountBeforeMutedMsg}, after: ${notifCountAfterMutedMsg}`);
  if (notifCountAfterMutedMsg !== notifCountBeforeMutedMsg) {
    throw new Error('❌ FAILED: Notification was generated for a muted room!');
  }
  console.log(`   ✅ PASSED: Room notification suppressed while room is muted.`);

  // Unmute room
  await roomService.toggleMuteRoom(host._id, activity._id);
  console.log(`   Host A unmuted the room.`);

  // 6. Global Notification OFF Test
  console.log(`\n🔕 6. Host A turning Global Notifications OFF in Settings...`);
  await User.updateOne({ _id: host._id }, { $set: { 'settings.notificationsEnabled': false } });

  const notifCountBeforeGlobalOff = (await Notification.find({ user: host._id })).length;

  await roomService.createMessage(activity._id, participant._id, {
    content: 'Testing global off notification suppression',
    type: 'message',
  });

  const notifCountAfterGlobalOff = (await Notification.find({ user: host._id })).length;
  console.log(`   Notifications count before global OFF: ${notifCountBeforeGlobalOff}, after: ${notifCountAfterGlobalOff}`);
  if (notifCountAfterGlobalOff !== notifCountBeforeGlobalOff) {
    throw new Error('❌ FAILED: Notification was generated when global notifications are OFF!');
  }
  console.log(`   ✅ PASSED: Room notification suppressed when global notifications are OFF.`);

  // Re-enable global notifications
  await User.updateOne({ _id: host._id }, { $set: { 'settings.notificationsEnabled': true } });

  // Cleanup test data
  await Activity.deleteOne({ _id: activity._id });
  await User.deleteMany({ _id: { $in: [host._id, participant._id] } });
  await JoinRequest.deleteMany({ activity: activity._id });
  await Message.deleteMany({ activity: activity._id });
  await Notification.deleteMany({ recipient: { $in: [host._id, participant._id] } });
  await Notification.deleteMany({ user: { $in: [host._id, participant._id] } });

  console.log('\n==================================================');
  console.log('🏆 ACTIVITY ROOM MESSAGING, VOICE & NOTIFICATION HIERARCHY PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ STAGING TEST ERROR:', err);
  process.exit(1);
});
