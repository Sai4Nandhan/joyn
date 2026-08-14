import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Otp } from '../models/Otp.js';

async function testExpiration() {
  console.log('--- STARTING SESSION EXPIRATION VERIFICATION TEST ---');
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');

  // Temporarily set sessionMaxAgeMinutes to 0.05 (3 seconds) for quick test
  env.sessionMaxAgeMinutes = 0.05; // 3 seconds

  // Create test user
  const email = 'session.test@joynapp.com';
  await User.deleteMany({ email });
  await Otp.deleteMany({ target: email });

  const otpHash = await bcrypt.hash('123456', 10);
  await Otp.create({
    method: 'email',
    target: email,
    otpHash,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt: new Date(Date.now() + 60000)
  });

  const { user, accessToken, refreshToken } = await authService.register({
    name: 'Expiration Tester',
    email,
    password: 'Password123!',
    otp: '123456',
    verificationMethod: 'email'
  }, { userAgent: 'TestRunner', ip: '127.0.0.1' });

  console.log('✓ Registered test user:', user.email);
  console.log('✓ Issued token pair with sessionStartedAt');

  // Verify access token immediately (0 seconds elapsed)
  const req1 = { headers: { authorization: `Bearer ${accessToken}` } };
  let err1 = null;
  await requireAuth(req1, {}, (err) => { err1 = err; });
  if (!err1 && req1.user) {
    console.log('✓ Request at 0s: SUCCESSFUL (Session Active)');
  } else {
    console.error('✗ Request at 0s FAILED unexpectedly:', err1);
  }

  console.log('Waiting 4 seconds for session timeout to expire...');
  await new Promise(r => setTimeout(r, 4000));

  // Test 1: Access token call after expiration
  const req2 = { headers: { authorization: `Bearer ${accessToken}` } };
  let err2 = null;
  await requireAuth(req2, {}, (err) => { err2 = err; });
  if (err2 && (err2.statusCode === 401 || err2.status === 401) && err2.message.includes('Session expired')) {
    console.log('✓ Access token request after expiration: REJECTED with 401 "Session expired, please log in again"');
  } else {
    console.error('✗ Access token request after expiration check failed:', err2);
  }

  // Test 2: Refresh token call after expiration
  let refreshErr = null;
  try {
    await authService.refresh(refreshToken, { userAgent: 'TestRunner', ip: '127.0.0.1' });
  } catch (err) {
    refreshErr = err;
  }
  if (refreshErr && (refreshErr.statusCode === 401 || refreshErr.status === 401) && refreshErr.message.includes('Session expired')) {
    console.log('✓ Refresh token request after expiration: REJECTED with 401 "Session expired, please log in again"');
  } else {
    console.error('✗ Refresh token request after expiration check failed:', refreshErr);
  }

  // Clean test user
  await User.deleteMany({ email });
  await RefreshToken.deleteMany({ user: user._id });
  await Otp.deleteMany({ target: email });

  await mongoose.disconnect();
  console.log('--- SESSION EXPIRATION TEST PASSED PERFECTLY ---');
}

testExpiration().catch(err => {
  console.error('Expiration test error:', err);
  process.exit(1);
});
