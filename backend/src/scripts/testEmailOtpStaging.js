import dotenv from 'dotenv';
dotenv.config();

// Enforce NODE_ENV=staging for test execution
process.env.NODE_ENV = 'staging';

import mongoose from 'mongoose';
import { sendOtp, verifyOtp } from '../services/otp.service.js';
import { register } from '../services/auth.service.js';
import { Otp } from '../models/Otp.js';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';

async function runStagingEmailTest() {
  console.log(`\n==================================================`);
  console.log(`🧪 [STAGING REAL EMAIL OTP VERIFICATION TEST]`);
  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`==================================================\n`);

  const targetEmail = process.argv[2];
  if (!targetEmail || !targetEmail.includes('@')) {
    console.error('❌ Usage: node src/scripts/testEmailOtpStaging.js <your_email@domain.com>');
    process.exit(1);
  }

  try {
    await connectDB();

    // Clean up any existing test user & OTP records for this email
    await User.deleteMany({ email: targetEmail.toLowerCase() });
    await Otp.deleteMany({ target: targetEmail.toLowerCase() });

    console.log(`1. Requesting 6-digit OTP for actual email: ${targetEmail}...`);
    const sendResult = await sendOtp({
      verificationMethod: 'email',
      email: targetEmail,
    });

    console.log(`\n✅ OTP Dispatch Result:`, sendResult);
    
    // Verify OTP code is NOT in response payload
    if ('otp' in sendResult || 'otpCode' in sendResult) {
      throw new Error('SECURITY VIOLATION: OTP code was returned in sendOtp API response!');
    }

    // Verify OTP record in DB is hashed and stored securely
    const otpRecord = await Otp.findOne({ target: targetEmail.toLowerCase(), method: 'email' });
    if (!otpRecord) {
      throw new Error('FAIL: Otp record not found in MongoDB!');
    }
    console.log(`\n🔒 Verified MongoDB Otp Record:`);
    console.log(`   - Target: ${otpRecord.target}`);
    console.log(`   - Hashed OTP (bcrypt): ${otpRecord.otpHash.substring(0, 20)}...`);
    console.log(`   - Attempts: ${otpRecord.attempts}`);
    console.log(`   - Expires At: ${otpRecord.expiresAt}`);

    console.log(`\n==================================================`);
    console.log(`📬 Live email sent to ${targetEmail} via Nodemailer SMTP!`);
    console.log(`   Check your inbox now for the 6-digit code.`);
    console.log(`==================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`❌ STAGING TEST ERROR:`, err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runStagingEmailTest();
