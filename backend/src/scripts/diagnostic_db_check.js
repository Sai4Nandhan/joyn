import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function diagnose() {
  console.log('==================================================');
  console.log('--- RUNTIME DATABASE DIAGNOSTIC ---');
  console.log('==================================================\n');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  const db = mongoose.connection.db;

  console.log('[DATABASE IDENTITY]');
  console.log(`- Host: ${mongoose.connection.host}`);
  console.log(`- Database Name: "${db.databaseName}"`);

  const collections = await db.listCollections().toArray();
  console.log(`- Collections Found: ${collections.map(c => c.name).join(', ')}`);

  console.log('\n[USERS COLLECTION INSPECTION]');
  const users = await db.collection('users').find({}).toArray();
  console.log(`- Total Users Found in "${db.databaseName}.users": ${users.length}\n`);

  if (users.length === 0) {
    console.log('⚠️  NO USER DOCUMENTS CURRENTLY EXIST IN THE USERS COLLECTION!');
  } else {
    users.forEach((u, i) => {
      console.log(`User #${i + 1}:`);
      console.log(`  _id: ${u._id}`);
      console.log(`  name: "${u.name}"`);
      console.log(`  email: "${u.email}" (Normalized: ${u.email === u.email.toLowerCase().trim() ? 'YES' : 'NO'})`);
      console.log(`  phone: ${u.phone ? `"${u.phone}"` : 'null'}`);
      console.log(`  passwordHash Exists: ${Boolean(u.passwordHash)}`);
      console.log(`  isEmailVerified: ${Boolean(u.isEmailVerified)}`);
      console.log(`  isPhoneVerified: ${Boolean(u.isPhoneVerified)}`);
      console.log(`  isSuspended: ${Boolean(u.isSuspended)}`);
      console.log(`  isDeleted: ${Boolean(u.isDeleted)}`);
      console.log(`  createdAt: ${u.createdAt}`);
      console.log('---');
    });
  }

  console.log('\n[OTHER COLLECTIONS DOCUMENT COUNTS]');
  for (const col of collections) {
    if (col.name === 'users') continue;
    const count = await db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.log('\n==================================================');
}

diagnose().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
