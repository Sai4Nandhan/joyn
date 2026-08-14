import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function createAdminAccount() {
  const email = process.env.ADMIN_EMAIL || 'admin_sys@joynapp.com';
  const password = process.env.ADMIN_PASSWORD || 'JOYN_Admin_Pass_2026!';
  const name = process.env.ADMIN_NAME || 'JOYN System Admin';

  console.log(`[Admin CLI] Initializing secure admin setup for ${email}...`);

  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.isIdentityVerified = true;
    await existing.save();
    console.log(`✔ Admin account updated for ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      isIdentityVerified: true,
      trustScore: 90,
      stats: { completedActivities: 0, activitiesHosted: 0 },
    });
    console.log(`✔ Admin account created successfully (ID: ${admin._id})`);
  }

  await mongoose.disconnect();
}

createAdminAccount().catch((err) => {
  console.error('❌ Failed to create admin account:', err);
  process.exit(1);
});
