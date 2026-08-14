import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri);
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    const userCount = await mongoose.connection.db.collection('users').countDocuments().catch(() => 0);

    console.log('[DATABASE DIAGNOSTIC]', {
      connected: true,
      host,
      databaseName: dbName,
      usersCollectionCount: userCount,
    });
  } catch (err) {
    console.error('[DATABASE CONNECTION FAILED]', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DATABASE] Connection disconnected');
  });
}
