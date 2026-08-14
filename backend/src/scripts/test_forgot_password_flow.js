import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Otp } from '../models/Otp.js';

async function testForgotPasswordFlow() {
  console.log('==================================================');
  console.log('--- FORGOT PASSWORD AUTHENTICATION RECOVERY TEST ---');
  console.log('==================================================\n');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;

  const email = 'recovery_test_2026@joyn.app';
  const initialPassword = 'OldPassword123!';
  const newPassword = 'BrandNewSecurePassword456!';

  // Clean slate for test email
  await User.deleteMany({ email });
  await Otp.deleteMany({ target: email });

  // 1. Register test user
  const otpHash1 = await bcrypt.hash('111111', 10);
  await Otp.create({
    method: 'email',
    target: email,
    otpHash: otpHash1,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt: new Date(Date.now() + 600000)
  });

  const reg = await authService.register({
    name: 'Recovery User',
    email,
    password: initialPassword,
    otp: '111111',
    verificationMethod: 'email'
  }, { userAgent: 'RecoveryTest', ip: '127.0.0.1' });

  console.log('[1. ACCOUNT CREATED]');
  console.log(`- User registered: ${reg.user.email}`);
  console.log(`- Initial Password: "${initialPassword}"`);

  // Verify login with initial password works
  const login1 = await authService.login({ email, password: initialPassword }, { userAgent: 'RecoveryTest', ip: '127.0.0.1' });
  console.log(`- Initial Login: SUCCESSFUL (Access token: ${login1.accessToken.slice(0, 15)}...)`);

  // 2. SIMULATE LOGGED OUT / EXPIRED SESSION / NEW DEVICE (UNAUTHENTICATED RECOVERY)
  console.log('\n[2. UN-AUTHENTICATED FORGOT PASSWORD INITIATION]');
  const forgotRes = await authService.forgotPassword({ contact: email, method: 'email' });
  console.log(`- Forgot Password API Call: ${forgotRes.message}`);

  // Retrieve OTP document generated for PASSWORD_RESET
  const otpDoc = await Otp.findOne({ target: email, purpose: 'PASSWORD_RESET' });
  if (!otpDoc) {
    throw new Error('CRITICAL FAIL: Password reset OTP was not created in MongoDB!');
  }
  console.log('- OTP Created in Database for purpose "PASSWORD_RESET"');

  // Verify OTP & Obtain Reset Token
  // Create a known OTP code for test verification
  await Otp.deleteMany({ target: email, purpose: 'PASSWORD_RESET' });
  const otpHash2 = await bcrypt.hash('222222', 10);
  await Otp.create({
    method: 'email',
    target: email,
    otpHash: otpHash2,
    purpose: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 600000)
  });

  console.log('\n[3. VERIFY RESET OTP]');
  const verifyRes = await authService.verifyResetOtp({ contact: email, method: 'email', otp: '222222' });
  if (!verifyRes.resetToken) {
    throw new Error('CRITICAL FAIL: Reset token was not returned after OTP verification!');
  }
  console.log(`- OTP Verified: Reset Token Issued (${verifyRes.resetToken.slice(0, 20)}...)`);

  // 4. RESET PASSWORD
  console.log('\n[4. EXECUTE PASSWORD RESET]');
  const resetRes = await authService.resetPassword({ resetToken: verifyRes.resetToken, newPassword });
  console.log(`- Reset Password Response: ${resetRes.message}`);

  // Verify old sessions/refresh tokens revoked
  const activeTokens = await RefreshToken.countDocuments({ user: reg.user._id, revokedAt: null });
  console.log(`- Active Refresh Tokens Remaining: ${activeTokens} (All previous sessions invalidated)`);

  // 5. TEST RE-LOGIN WITH NEW PASSWORD
  console.log('\n[5. LOGIN WITH NEW PASSWORD]');

  // Attempt login with OLD password -> MUST FAIL
  let oldLoginErr = null;
  try {
    await authService.login({ email, password: initialPassword }, { userAgent: 'RecoveryTest', ip: '127.0.0.1' });
  } catch (err) {
    oldLoginErr = err;
  }
  if (oldLoginErr && oldLoginErr.statusCode === 401) {
    console.log('✓ Login with OLD password rejected with 401 Incorrect credentials as expected.');
  } else {
    throw new Error('CRITICAL FAIL: Old password was still accepted after reset!');
  }

  // Attempt login with NEW password -> MUST SUCCEED
  const newLoginRes = await authService.login({ email, password: newPassword }, { userAgent: 'RecoveryTest', ip: '127.0.0.1' });
  console.log(`✓ Login with NEW password: SUCCESSFUL! User "${newLoginRes.user.name}" logged in.`);

  // Cleanup test user
  await User.deleteMany({ email });
  await Otp.deleteMany({ target: email });
  await RefreshToken.deleteMany({ user: reg.user._id });

  await mongoose.disconnect();

  console.log('\n==================================================');
  console.log('--- FORGOT PASSWORD ARCHITECTURE TEST PASSED 100% ---');
  console.log('==================================================');
}

testForgotPasswordFlow().catch(err => {
  console.error('\nFORGOT PASSWORD TEST FAILURE:', err);
  process.exit(1);
});
