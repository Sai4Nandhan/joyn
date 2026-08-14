import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';

async function verifyAccountLookup() {
  console.log('==================================================');
  console.log('--- DIAGNOSTIC USER LOOKUP TEST ---');
  console.log('==================================================\n');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;

  const testEmail = 'real_user_account@joyn.app';
  const testPassword = 'RealPassword123!';

  // Step 1: Create real user document if not already present
  let user = await User.findOne({ email: testEmail });
  if (!user) {
    const passwordHash = await User.hashPassword(testPassword);
    user = await User.create({
      name: 'Real Persistent User',
      email: testEmail,
      isEmailVerified: true,
      passwordHash
    });
    console.log(`[USER CREATED FOR LOOKUP TEST] ID: ${user._id}, Email: "${user.email}"`);
  } else {
    console.log(`[USER ALREADY EXISTS IN DB] ID: ${user._id}, Email: "${user.email}"`);
  }

  // Step 2: Perform Login Lookup Trace
  console.log('\n[LOGIN QUERY TRACE]');
  const rawInput = testEmail;
  const normalizedEmail = rawInput.trim().toLowerCase();

  console.log(`- Received Input: "${rawInput}"`);
  console.log(`- Normalized Email: "${normalizedEmail}"`);
  console.log(`- Database Name: "${db.databaseName}"`);
  console.log(`- Collection: "users"`);

  const foundUser = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } }).select('+passwordHash');

  console.log(`- User Found in MongoDB: ${Boolean(foundUser)}`);
  if (foundUser) {
    console.log(`- Found User ObjectId: ${foundUser._id}`);
    console.log(`- Found User Email: "${foundUser.email}"`);
    console.log(`- Password Hash Exists: ${Boolean(foundUser.passwordHash)}`);

    const passwordMatch = await foundUser.comparePassword(testPassword);
    console.log(`- bcrypt.compare(Password, Hash): ${passwordMatch}`);
  }

  // Step 3: Perform Login via authService
  const loginRes = await authService.login({ email: testEmail, password: testPassword }, { userAgent: 'Diagnostic', ip: '127.0.0.1' });
  console.log(`\n✓ authService.login() result: SUCCESS! User ID ${loginRes.user._id}`);

  // Step 4: Perform Forgot Password Lookup Trace
  console.log('\n[FORGOT PASSWORD LOOKUP TRACE]');
  const forgotRes = await authService.forgotPassword({ contact: testEmail, method: 'email' });
  console.log(`✓ authService.forgotPassword() result: "${forgotRes.message}"`);

  await mongoose.disconnect();
  console.log('\n==================================================');
}

verifyAccountLookup().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
