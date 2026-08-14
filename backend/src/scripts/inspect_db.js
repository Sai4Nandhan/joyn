import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function inspect() {
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('--- ALL COLLECTIONS ---');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`${col.name}: ${count} documents`);
  }

  console.log('\n--- ALL USERS DETAILS ---');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  users.forEach(u => {
    console.log(JSON.stringify({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isEmailVerified: u.isEmailVerified,
      isPhoneVerified: u.isPhoneVerified,
      createdAt: u.createdAt
    }, null, 2));
  });

  console.log('\n--- ALL ACTIVITIES DETAILS ---');
  const activities = await mongoose.connection.db.collection('activities').find({}).toArray();
  activities.forEach(a => {
    console.log(JSON.stringify({
      id: a._id.toString(),
      title: a.title,
      host: a.host,
      category: a.category,
      locationName: a.locationName || a.location?.name,
      createdAt: a.createdAt
    }, null, 2));
  });

  console.log('\n--- OTHER COLLECTIONS COUNTS ---');
  for (const col of collections) {
    if (['users', 'activities'].includes(col.name)) continue;
    const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
    console.log(`Collection: ${col.name} -> ${docs.length} docs`);
  }

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
