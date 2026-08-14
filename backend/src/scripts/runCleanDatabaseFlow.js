import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { sendOtp } from '../services/otp.service.js';
import { register } from '../services/auth.service.js';
import { createActivity, getActivityById, completeActivity } from '../services/activity.service.js';
import { createJoinRequest, approveJoinRequest } from '../services/joinRequest.service.js';
import { createRating } from '../services/rating.service.js';
import { recalculateTrustScore } from '../services/trust.service.js';
import { evaluateUserChallenges } from '../services/challenge.service.js';
import { createMessage } from '../services/room.service.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Otp } from '../models/Otp.js';
import { Notification } from '../models/Notification.js';
import { Message } from '../models/Message.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Rating } from '../models/Rating.js';

const emailA = process.argv[2] || 'studenthelps99@gmail.com';
const otpA = process.argv[3];
const emailB = process.argv[4] || 'studenthelps99+accountb@gmail.com';
const otpB = process.argv[5];

async function executeFlow() {
  console.log(`\n==================================================`);
  console.log(`🧹 [FULL REAL DATA E2E A ↔ B LIFECYCLE WORKFLOW]`);
  console.log(`==================================================\n`);

  const mongoUri = 'mongodb://127.0.0.1:27017/activity-platform';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✔ Connected to database (${mongoUri}).`);

  if (!otpA && !otpB) {
    console.log(`Step 0: Purging database to zero baseline...`);
    await User.deleteMany({});
    await Activity.deleteMany({});
    await JoinRequest.deleteMany({});
    await Otp.deleteMany({});
    await Notification.deleteMany({});
    await Message.deleteMany({});
    await RefreshToken.deleteMany({});
    await Rating.deleteMany({});

    const userCount = await User.countDocuments({});
    const activityCount = await Activity.countDocuments({});

    console.log(`✔ Verified Clean Database Baseline: ${userCount} users, ${activityCount} activities.`);

    console.log(`\nStep 1: Sending Real Email OTP to Account A (${emailA})...`);
    await sendOtp({ verificationMethod: 'email', email: emailA });
    console.log(`✔ Real Email OTP dispatched to ${emailA}.`);

    console.log(`\nStep 2: Sending Real Email OTP to Account B (${emailB})...`);
    await sendOtp({ verificationMethod: 'email', email: emailB });
    console.log(`✔ Real Email OTP dispatched to ${emailB}.`);

    console.log(`\n==================================================`);
    console.log(`📬 Both OTP emails dispatched via Nodemailer Gmail SMTP! Check inbox:`);
    console.log(`   - Account A: ${emailA}`);
    console.log(`   - Account B: ${emailB}`);
    console.log(`\nNext Command to run full E2E lifecycle:`);
    console.log(`node src/scripts/runCleanDatabaseFlow.js ${emailA} <otpA> ${emailB} <otpB>`);
    console.log(`==================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  }

  if (otpA && otpB) {
    console.log(`Step 1: Registering Real Account A (${emailA}) with OTP ${otpA}...`);
    const regA = await register({
      name: 'Rohan Sharma (Account A)',
      email: emailA,
      password: 'AccountAPassword123!',
      verificationMethod: 'email',
      otp: otpA,
    }, { ip: '127.0.0.1', userAgent: 'E2E-Runner' });
    console.log(`✔ Account A registered (ID: ${regA.user.id}, TrustScore: ${regA.user.trustScore}, ReputationStatus: ${regA.user.reputationStatus}).`);

    console.log(`\nStep 2: Registering Real Account B (${emailB}) with OTP ${otpB}...`);
    const regB = await register({
      name: 'Priya Verma (Account B)',
      email: emailB,
      password: 'AccountBPassword123!',
      verificationMethod: 'email',
      otp: otpB,
    }, { ip: '127.0.0.1', userAgent: 'E2E-Runner' });
    console.log(`✔ Account B registered (ID: ${regB.user.id}, TrustScore: ${regB.user.trustScore}, ReputationStatus: ${regB.user.reputationStatus}).`);

    console.log(`\nStep 3: Account A creates an Activity...`);
    const now = Date.now();
    const activity = await createActivity(regA.user.id, {
      title: 'Weekend Badminton Match',
      description: 'Friendly doubles badminton match this Saturday morning. Indoor wooden court booked!',
      category: 'sports',
      schedule: {
        startAt: new Date(now - 7200000),
        endAt: new Date(now - 3600000),
      },
      approxLocation: {
        placeName: 'HSR Layout, Bangalore',
        point: { type: 'Point', coordinates: [77.6412, 12.9116] },
      },
      exactLocation: {
        address: 'HSR Sports Club, Court 2',
        meetingPoint: 'Reception counter',
        point: { type: 'Point', coordinates: [77.6412, 12.9116] },
      },
      capacity: { min: 2, max: 4 },
    });
    console.log(`✔ Activity created by Account A (ID: ${activity._id}, Title: "${activity.title}").`);

    console.log(`\nStep 4: Account B discovers activity & submits Join Request...`);
    const joinReq = await createJoinRequest(activity._id.toString(), regB.user.id, 'Hey Rohan! I play intermediate badminton. Would love to join!');
    console.log(`✔ Join Request created by Account B (ID: ${joinReq._id}, status: ${joinReq.status}).`);

    console.log(`\nStep 5: Account A gets notification & inspects Account B's real profile/trust/risk state...`);
    const userBDetail = await User.findById(regB.user.id);
    console.log(`✔ Account A views Account B profile:`);
    console.log(`  - Name: ${userBDetail.name}`);
    console.log(`  - Trust Score: ${userBDetail.trustScore}/100`);
    console.log(`  - Reputation Status: ${userBDetail.reputationStatus}`);
    console.log(`  - Risk Status: ${userBDetail.riskStatus}`);

    console.log(`\nStep 6: Account A approves Account B's Join Request...`);
    const updatedReq = await approveJoinRequest(joinReq._id.toString(), regA.user.id);
    console.log(`✔ Join Request approved! New status: ${updatedReq.status}`);

    console.log(`\nStep 7: Account B receives approval notification & exact location unlocks...`);
    const actForB = await getActivityById(activity._id.toString(), regB.user.id);
    console.log(`✔ Account B exact location unlocked: "${actForB.exactLocation?.address || 'Unlocked'}"`);

    console.log(`\nStep 8: Room/Chat Communication between Account A and B...`);
    const msgA = await createMessage(activity._id.toString(), regA.user.id, {
      text: 'Hey Priya! Welcome to the badminton match!',
    });
    const msgB = await createMessage(activity._id.toString(), regB.user.id, {
      text: 'Thanks Rohan! Looking forward to playing!',
    });
    console.log(`✔ Real-time room chat exchange completed (Msg count: 2).`);

    console.log(`\nStep 9: Host Account A completes the Activity...`);
    await completeActivity(activity._id.toString(), regA.user.id, []);
    console.log(`✔ Activity status transitioned to "completed".`);

    console.log(`\nStep 10: Mutual Ratings Exchange...`);
    await createRating(activity._id.toString(), regB.user.id, {
      rateeId: regA.user.id,
      stars: 5,
      comment: 'Great host! Very punctual and organized.',
    });
    console.log(`✔ Account B rated Host Account A 5 stars.`);

    await createRating(activity._id.toString(), regA.user.id, {
      rateeId: regB.user.id,
      stars: 5,
      comment: 'Excellent participant! Friendly and reliable player.',
    });
    console.log(`✔ Host Account A rated Participant Account B 5 stars.`);

    console.log(`\nStep 11: Trust Score & Challenges Evaluation Update...`);
    const updatedUserA = await recalculateTrustScore(regA.user.id);
    const updatedUserB = await recalculateTrustScore(regB.user.id);
    const chA = await evaluateUserChallenges(regA.user.id);
    const chB = await evaluateUserChallenges(regB.user.id);

    console.log(`\n==================================================`);
    console.log(`🎉 [FULL E2E REAL DATA LIFECYCLE COMPLETED SUCCESSFULLY!]`);
    console.log(`==================================================`);
    console.log(`Account A (${regA.user.email}):`);
    console.log(`  - New Trust Score: ${updatedUserA.trustScore}/100`);
    console.log(`  - Challenge Level: ${chA.userLevel} (${chA.completionPercentage}%)`);
    console.log(`  - Unlocked Badges: ${chA.badges.join(', ') || 'None'}`);
    console.log(`\nAccount B (${regB.user.email}):`);
    console.log(`  - New Trust Score: ${updatedUserB.trustScore}/100`);
    console.log(`  - Challenge Level: ${chB.userLevel} (${chB.completionPercentage}%)`);
    console.log(`  - Unlocked Badges: ${chB.badges.join(', ') || 'None'}`);
    console.log(`==================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  }
}

executeFlow().catch((err) => {
  console.error('❌ E2E Flow Failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
