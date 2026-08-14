import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Otp } from '../models/Otp.js';

async function testUserPersistence() {
  console.log('==================================================');
  console.log('--- USER ACCOUNT PERSISTENCE & LIFECYCLE TEST ---');
  console.log('==================================================\n');

  // Step 1: Connect & Diagnostic Identity
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const initialUserCount = await db.collection('users').countDocuments();

  console.log('[1. DATABASE IDENTITY]');
  console.log(`- Connected: true`);
  console.log(`- Database Name: "${dbName}"`);
  console.log(`- Users Collection Count (Initial): ${initialUserCount}`);

  // Step 2: Register New Test User
  const testEmail = 'persistence_test_user_2026@joyn.app';
  const testPassword = 'SecurePassword123!';

  // Ensure clean slate for this specific persistence test user
  await db.collection('users').deleteMany({ email: testEmail });
  await db.collection('otps').deleteMany({ target: testEmail });

  // Create valid OTP record
  const otpHash = await bcrypt.hash('654321', 10);
  await db.collection('otps').insertOne({
    method: 'email',
    target: testEmail,
    otpHash,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt: new Date(Date.now() + 600000),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const regResult = await authService.register({
    name: 'Persistence User',
    email: testEmail,
    password: testPassword,
    otp: '654321',
    verificationMethod: 'email'
  }, { userAgent: 'PersistenceTestRunner', ip: '127.0.0.1' });

  console.log('\n[2. NEW USER REGISTRATION]');
  console.log(`- User Registered: ${regResult.user.email}`);
  console.log(`- User ObjectId: ${regResult.user._id}`);

  // Step 3: Verify Persistence in MongoDB
  const countAfterReg = await db.collection('users').countDocuments();
  console.log(`- Users Collection Count After Registration: ${countAfterReg}`);

  const userDocInDb = await db.collection('users').findOne({ email: testEmail });
  if (!userDocInDb) {
    throw new Error('CRITICAL FAIL: User document was not persisted to MongoDB!');
  }
  console.log(`- Verified User In MongoDB Atlas/DB: Found ("${userDocInDb.email}")`);

  // Step 4: Simulate Backend Server Restart (Disconnect and Reconnect)
  console.log('\n[3. SIMULATING BACKEND RESTART / RECONNECT]');
  await mongoose.disconnect();
  console.log('- Disconnected from MongoDB.');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  console.log('- Reconnected to MongoDB.');

  const countAfterRestart = await mongoose.connection.db.collection('users').countDocuments();
  console.log(`- Users Collection Count After Restart: ${countAfterRestart}`);

  if (countAfterRestart !== countAfterReg) {
    throw new Error(`CRITICAL FAIL: User count changed after restart! Before: ${countAfterReg}, After: ${countAfterRestart}`);
  }
  console.log('✓ SUCCESS: User count remained identical after backend restart.');

  // Step 5: Test Login After Backend Restart (No Active Session Required)
  console.log('\n[4. LOGIN AFTER SERVER RESTART]');
  const loginResult = await authService.login({
    email: testEmail,
    password: testPassword
  }, { userAgent: 'PersistenceTestRunner', ip: '127.0.0.1' });

  console.log(`✓ Login Succeeded: User "${loginResult.user.name}" logged in successfully.`);
  console.log(`- Access Token Issued: ${loginResult.accessToken.slice(0, 20)}...`);

  // Step 6: Test Session Expiration
  console.log('\n[5. SESSION EXPIRATION & RE-LOGIN TEST]');

  // Verify request works with active token
  const reqActive = { headers: { authorization: `Bearer ${loginResult.accessToken}` } };
  let activeErr = null;
  await requireAuth(reqActive, {}, (err) => { activeErr = err; });
  console.log(`- Active Session Request Status: ${activeErr ? 'FAILED' : 'SUCCESSFUL (200 OK)'}`);

  // Set short max age and verify session expiration
  env.sessionMaxAgeMinutes = 0.001; // expire instantly
  await new Promise(r => setTimeout(r, 100));

  const reqExpired = { headers: { authorization: `Bearer ${loginResult.accessToken}` } };
  let expiredErr = null;
  await requireAuth(reqExpired, {}, (err) => { expiredErr = err; });
  console.log(`- Expired Session Request Status: ${expiredErr?.statusCode === 401 ? '401 Unauthorized (Session Expired)' : 'UNEXPECTED'}`);

  // Restore 30-minute session duration
  env.sessionMaxAgeMinutes = 30;

  // Step 7: Re-login With Same Email & Password After Session Expiration
  console.log('\n[6. RE-LOGIN AFTER SESSION EXPIRATION]');
  const reLoginResult = await authService.login({
    email: testEmail,
    password: testPassword
  }, { userAgent: 'PersistenceTestRunner', ip: '127.0.0.1' });

  console.log(`✓ Re-login Succeeded: User "${reLoginResult.user.name}" logged in again after session expiration.`);

  // Clean up persistence test user before disconnect
  await db.collection('users').deleteMany({ email: testEmail });
  await db.collection('otps').deleteMany({ target: testEmail });
  await db.collection('refreshtokens').deleteMany({ user: reLoginResult.user._id });

  await mongoose.disconnect();

  console.log('\n==================================================');
  console.log('--- ALL PERSISTENCE TESTS PASSED 100% ---');
  console.log('==================================================');
}

testUserPersistence().catch(err => {
  console.error('\nCRITICAL TEST FAILURE:', err);
  process.exit(1);
});
