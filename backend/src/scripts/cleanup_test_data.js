import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCleanup() {
  if (!process.argv.includes('--confirm-destructive-cleanup')) {
    console.error('❌ SAFETY ABORT: Data cleanup requires explicit --confirm-destructive-cleanup flag.');
    console.error('   Usage: node src/scripts/cleanup_test_data.js --confirm-destructive-cleanup');
    process.exit(1);
  }

  console.log('--- STARTING MANUAL CONFIRMED STAGING DATA CLEANUP ---');
  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  const db = mongoose.connection.db;

  // 1. Identify Test Users
  const testUserIds = [
    '6a7c394c356408a51f0c5f84',
    '6a7e03b25cf50902a4c9c41b',
    '6a7ea9dfee9e7a983f54582e'
  ];

  console.log(`\nIdentified ${testUserIds.length} test user accounts to clean:`, testUserIds);

  // 2. Identify Test Activities
  const testActivityIds = [
    '6a7ea750d41ff19304cebc14',
    '6a7ea75fea37fc5638f80496',
    '6a7ea8678edebbf15988265d'
  ];

  console.log(`Identified ${testActivityIds.length} test activity records to clean:`, testActivityIds);

  // Convert IDs to ObjectIds
  const objUserIds = testUserIds.map(id => new mongoose.Types.ObjectId(id));
  const objActivityIds = testActivityIds.map(id => new mongoose.Types.ObjectId(id));

  // 3. Perform Cascaded Deletions on MongoDB Collections
  console.log('\n--- EXECUTING DATABASE RECORD CLEANUP ---');

  const resUsers = await db.collection('users').deleteMany({ _id: { $in: objUserIds } });
  console.log(`✓ Deleted Users: ${resUsers.deletedCount}`);

  const resActivities = await db.collection('activities').deleteMany({
    $or: [
      { _id: { $in: objActivityIds } },
      { host: { $in: objUserIds } }
    ]
  });
  console.log(`✓ Deleted Activities: ${resActivities.deletedCount}`);

  const resJoinReqs = await db.collection('joinrequests').deleteMany({
    $or: [
      { user: { $in: objUserIds } },
      { activity: { $in: objActivityIds } }
    ]
  });
  console.log(`✓ Deleted Join Requests: ${resJoinReqs.deletedCount}`);

  const resDMs = await db.collection('directmessages').deleteMany({});
  console.log(`✓ Deleted Direct Messages: ${resDMs.deletedCount}`);

  const resMessages = await db.collection('messages').deleteMany({
    $or: [
      { sender: { $in: objUserIds } },
      { activity: { $in: objActivityIds } }
    ]
  });
  console.log(`✓ Deleted Activity Room Messages: ${resMessages.deletedCount}`);

  const resNotifs = await db.collection('notifications').deleteMany({});
  console.log(`✓ Deleted Notifications: ${resNotifs.deletedCount}`);

  const resTokens = await db.collection('refreshtokens').deleteMany({
    user: { $in: objUserIds }
  });
  console.log(`✓ Deleted Refresh Tokens: ${resTokens.deletedCount}`);

  const resOTPs = await db.collection('otps').deleteMany({});
  console.log(`✓ Deleted Test OTPs: ${resOTPs.deletedCount}`);

  // Delete any orphaned ratings, polls, expenses, checklists, reports, friendrequests if existing
  const resRatings = await db.collection('ratings').deleteMany({
    $or: [{ rater: { $in: objUserIds } }, { targetUser: { $in: objUserIds } }, { activity: { $in: objActivityIds } }]
  });
  console.log(`✓ Deleted Ratings: ${resRatings.deletedCount}`);

  const resPolls = await db.collection('polls').deleteMany({ activity: { $in: objActivityIds } });
  console.log(`✓ Deleted Polls: ${resPolls.deletedCount}`);

  const resExpenses = await db.collection('expenses').deleteMany({ activity: { $in: objActivityIds } });
  console.log(`✓ Deleted Expenses: ${resExpenses.deletedCount}`);

  const resChecklists = await db.collection('checklistitems').deleteMany({ activity: { $in: objActivityIds } });
  console.log(`✓ Deleted Checklist Items: ${resChecklists.deletedCount}`);

  const resReports = await db.collection('reports').deleteMany({
    $or: [{ reporter: { $in: objUserIds } }, { reportedUser: { $in: objUserIds } }]
  });
  console.log(`✓ Deleted Reports: ${resReports.deletedCount}`);

  const resFriends = await db.collection('friendrequests').deleteMany({
    $or: [{ sender: { $in: objUserIds } }, { recipient: { $in: objUserIds } }]
  });
  console.log(`✓ Deleted Friend Requests: ${resFriends.deletedCount}`);

  // 4. File Uploads Cleanup
  console.log('\n--- EXECUTING UPLOAD FILES CLEANUP ---');
  const uploadsDir = path.resolve(__dirname, '../../uploads');

  const uploadSubdirs = ['profiles', 'verifications', 'voice'];
  let deletedFilesCount = 0;

  for (const subdir of uploadSubdirs) {
    const dirPath = path.join(uploadsDir, subdir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        // Skip hidden / system files
        if (file.startsWith('.')) continue;
        const filePath = path.join(dirPath, file);
        try {
          fs.unlinkSync(filePath);
          deletedFilesCount++;
          console.log(`  - Deleted test file: uploads/${subdir}/${file}`);
        } catch (err) {
          console.error(`  ! Failed to delete ${filePath}:`, err.message);
        }
      }
    }
  }
  console.log(`✓ Deleted Test Upload Files Total: ${deletedFilesCount}`);

  // 5. Verification of Database Structure & Preserved Collections
  console.log('\n--- VERIFYING PRESERVED COLLECTIONS & STRUCTURE ---');
  const collections = await db.listCollections().toArray();
  console.log(`Total Collections Preserved: ${collections.length}`);
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  • ${col.name}: ${count} remaining records`);
  }

  await mongoose.disconnect();
  console.log('\n--- SAFE STAGING CLEANUP COMPLETE ---');
}

runCleanup().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
