import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function removeDiagnostics() {
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;

  const diagEmails = ['real_user_account@joyn.app', 'persistence_test_user_2026@joyn.app'];
  const res = await db.collection('users').deleteMany({ email: { $in: diagEmails } });
  console.log(`✓ Removed ${res.deletedCount} diagnostic test accounts.`);

  await mongoose.disconnect();
}

removeDiagnostics().catch(err => {
  console.error(err);
  process.exit(1);
});
