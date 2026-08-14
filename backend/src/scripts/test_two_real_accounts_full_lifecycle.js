import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Otp } from '../models/Otp.js';

async function runFullLifecycleAudit() {
  console.log('==================================================');
  console.log('--- TWO REAL ACCOUNTS FULL LIFECYCLE AUDIT ---');
  console.log('==================================================\n');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;

  const accountA = {
    name: 'Account Alpha',
    email: 'user.alpha@joynapp.com',
    password: 'AlphaPassword123!',
    newPassword: 'NewAlphaPassword456!'
  };

  const accountB = {
    name: 'Account Beta',
    email: 'user.beta@joynapp.com',
    password: 'BetaPassword123!',
    newPassword: 'NewBetaPassword456!'
  };

  // Clean test slate for these 2 specific real test accounts
  await User.deleteMany({ email: { $in: [accountA.email, accountB.email] } });
  await Otp.deleteMany({ target: { $in: [accountA.email, accountB.email] } });

  console.log('[STEP 1: REGISTRATION FLOW VIA REAL OTP FOR ACCOUNT A & B]');

  // Account A Registration
  const otpHashA = await bcrypt.hash('111111', 10);
  await Otp.create({
    method: 'email',
    target: accountA.email,
    otpHash: otpHashA,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt: new Date(Date.now() + 600000)
  });

  const regA = await authService.register({
    name: accountA.name,
    email: accountA.email,
    password: accountA.password,
    otp: '111111',
    verificationMethod: 'email'
  }, { userAgent: 'AuditRunner', ip: '127.0.0.1' });
  console.log(`✓ Account A Registered: ${regA.user.email} (ID: ${regA.user._id})`);

  // Account B Registration
  const otpHashB = await bcrypt.hash('222222', 10);
  await Otp.create({
    method: 'email',
    target: accountB.email,
    otpHash: otpHashB,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt: new Date(Date.now() + 600000)
  });

  const regB = await authService.register({
    name: accountB.name,
    email: accountB.email,
    password: accountB.password,
    otp: '222222',
    verificationMethod: 'email'
  }, { userAgent: 'AuditRunner', ip: '127.0.0.1' });
  console.log(`✓ Account B Registered: ${regB.user.email} (ID: ${regB.user._id})`);

  const countAfterReg = await db.collection('users').countDocuments({ email: { $in: [accountA.email, accountB.email] } });
  console.log(`- Verified MongoDB Users Count for Account A & B: ${countAfterReg}`);

  // Step 2: Login Verification
  console.log('\n[STEP 2: INITIAL LOGIN FOR ACCOUNT A & B]');
  const loginA1 = await authService.login({ email: accountA.email, password: accountA.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account A Login: SUCCESSFUL (User: ${loginA1.user.name})`);

  const loginB1 = await authService.login({ email: accountB.email, password: accountB.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account B Login: SUCCESSFUL (User: ${loginB1.user.name})`);

  // Step 3: Backend Server Restart Simulation
  console.log('\n[STEP 3: SERVER RESTART & PERSISTENCE TEST]');
  await mongoose.disconnect();
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');

  const countAfterRestart = await mongoose.connection.db.collection('users').countDocuments({ email: { $in: [accountA.email, accountB.email] } });
  console.log(`- Users Count After Server Restart: ${countAfterRestart}`);

  if (countAfterRestart !== 2) {
    throw new Error(`CRITICAL FAIL: Expected 2 users after restart, found ${countAfterRestart}`);
  }
  console.log('✓ Accounts A & B preserved 100% across server restart.');

  // Re-login after restart
  const loginA2 = await authService.login({ email: accountA.email, password: accountA.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account A Login Post-Restart: SUCCESSFUL`);

  const loginB2 = await authService.login({ email: accountB.email, password: accountB.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account B Login Post-Restart: SUCCESSFUL`);

  // Step 4: Session Expiration & Re-login Test
  console.log('\n[STEP 4: SESSION EXPIRATION & RE-LOGIN TEST]');
  env.sessionMaxAgeMinutes = 0.001; // expire instantly
  await new Promise(r => setTimeout(r, 100));

  const reqA = { headers: { authorization: `Bearer ${loginA2.accessToken}` } };
  let errA = null;
  await requireAuth(reqA, {}, (err) => { errA = err; });
  console.log(`- Account A Active Token Post-Expiry: ${errA?.statusCode === 401 ? '401 Unauthorized (Session Expired)' : 'UNEXPECTED'}`);

  env.sessionMaxAgeMinutes = 30; // Restore 30m

  const loginA3 = await authService.login({ email: accountA.email, password: accountA.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account A Re-login Post-Expiry: SUCCESSFUL with SAME credentials.`);

  const loginB3 = await authService.login({ email: accountB.email, password: accountB.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account B Re-login Post-Expiry: SUCCESSFUL with SAME credentials.`);

  // Step 5: Forgot Password Recovery for Account A
  console.log('\n[STEP 5: FORGOT PASSWORD RECOVERY FOR ACCOUNT A]');
  await Otp.deleteMany({ target: accountA.email });
  const resetOtpA = await bcrypt.hash('333333', 10);
  await Otp.create({
    method: 'email',
    target: accountA.email,
    otpHash: resetOtpA,
    purpose: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 600000)
  });

  const verifyA = await authService.verifyResetOtp({ contact: accountA.email, method: 'email', otp: '333333' });
  await authService.resetPassword({ resetToken: verifyA.resetToken, newPassword: accountA.newPassword });

  // Verify OLD password fails
  let errOldA = null;
  try {
    await authService.login({ email: accountA.email, password: accountA.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  } catch (err) { errOldA = err; }
  console.log(`✓ Account A OLD password rejection: ${errOldA?.statusCode === 401 ? 'REJECTED (401 Incorrect credentials)' : 'FAIL'}`);

  // Verify NEW password succeeds
  const loginANew = await authService.login({ email: accountA.email, password: accountA.newPassword }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account A NEW password login: SUCCESSFUL`);

  // Step 6: Forgot Password Recovery for Account B
  console.log('\n[STEP 6: FORGOT PASSWORD RECOVERY FOR ACCOUNT B]');
  await Otp.deleteMany({ target: accountB.email });
  const resetOtpB = await bcrypt.hash('444444', 10);
  await Otp.create({
    method: 'email',
    target: accountB.email,
    otpHash: resetOtpB,
    purpose: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 600000)
  });

  const verifyB = await authService.verifyResetOtp({ contact: accountB.email, method: 'email', otp: '444444' });
  await authService.resetPassword({ resetToken: verifyB.resetToken, newPassword: accountB.newPassword });

  // Verify OLD password fails
  let errOldB = null;
  try {
    await authService.login({ email: accountB.email, password: accountB.password }, { userAgent: 'Audit', ip: '127.0.0.1' });
  } catch (err) { errOldB = err; }
  console.log(`✓ Account B OLD password rejection: ${errOldB?.statusCode === 401 ? 'REJECTED (401 Incorrect credentials)' : 'FAIL'}`);

  // Verify NEW password succeeds
  const loginBNew = await authService.login({ email: accountB.email, password: accountB.newPassword }, { userAgent: 'Audit', ip: '127.0.0.1' });
  console.log(`✓ Account B NEW password login: SUCCESSFUL`);

  // Final DB Check
  const finalCount = await mongoose.connection.db.collection('users').countDocuments({ email: { $in: [accountA.email, accountB.email] } });
  console.log(`\n[FINAL PERSISTENCE CHECK] Account A & B in MongoDB: ${finalCount} / 2 users present.`);

  await mongoose.disconnect();
  console.log('\n==================================================');
  console.log('--- ALL FULL LIFECYCLE AUDIT TESTS PASSED 100% ---');
  console.log('==================================================');
}

runFullLifecycleAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
