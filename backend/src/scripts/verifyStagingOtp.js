import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'staging';

import mongoose from 'mongoose';
import { register } from '../services/auth.service.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { connectDB } from '../config/db.js';

async function verifyStagingOtp() {
  const email = process.argv[2];
  const otp = process.argv[3];

  if (!email || !otp) {
    console.error('Usage: node src/scripts/verifyStagingOtp.js <email> <6-digit-otp>');
    process.exit(1);
  }

  try {
    await connectDB();

    console.log(`Verifying OTP ${otp} and registering real account for ${email}...`);
    const regResult = await register({
      name: 'Staging Verified User',
      email,
      password: 'StagingPassword123!',
      verificationMethod: 'email',
      otp,
    }, { ip: '127.0.0.1', userAgent: 'StagingTest' });

    console.log(`\n==================================================`);
    console.log(`🎉 [REGISTRATION & OTP VERIFICATION SUCCESSFUL!]`);
    console.log(`   User ID: ${regResult.user.id}`);
    console.log(`   Email: ${regResult.user.email}`);
    console.log(`   isEmailVerified: ${regResult.user.isEmailVerified}`);
    console.log(`==================================================\n`);

    // Verify OTP record has been deleted from MongoDB to prevent replay
    const remainingOtp = await Otp.findOne({ target: email.toLowerCase() });
    if (remainingOtp) {
      console.error('⚠️ Warning: Otp record still exists after registration!');
    } else {
      console.log('🔒 Confirmed: Otp record deleted from MongoDB (replay prevention verified).');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyStagingOtp();
