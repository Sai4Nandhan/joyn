import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function compareDatabases() {
  console.log('==================================================');
  console.log('--- READ-ONLY DATABASE COMPARISON & AUDIT ---');
  console.log('==================================================\n');

  // 1. Inspect MONGO_URI Configuration
  const uri = env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform';

  // Extract cluster/host and configured database name from URI safely
  const parsedUri = new URL(uri.startsWith('mongodb') ? uri : `mongodb://${uri}`);
  const configuredDbName = parsedUri.pathname ? parsedUri.pathname.replace('/', '') : 'default (test)';

  console.log('[1. MONGO_URI CONFIGURATION INSPECTION]');
  console.log(`- Configured Host/Cluster: ${parsedUri.host}`);
  console.log(`- Configured Database Name in URI: "${configuredDbName}"`);
  console.log(`- Environment: ${env.nodeEnv}`);

  // Connect to MongoDB
  await mongoose.connect(uri);
  const client = mongoose.connection.client;
  const adminDb = client.db().admin();

  // List all available databases on the cluster/server
  let dbList = [];
  try {
    const listResult = await adminDb.listDatabases();
    dbList = listResult.databases.map(d => d.name);
    console.log(`- Total Databases Available on Server/Cluster: ${dbList.length}`);
    console.log(`  List: [${dbList.join(', ')}]`);
  } catch (err) {
    console.log(`- Admin listDatabases restricted, checking target databases directly.`);
    dbList = ['activity-platform', 'test'];
  }

  // Targets to compare
  const targetDbs = Array.from(new Set(['test', 'activity-platform', ...dbList.filter(d => ['test', 'activity-platform', 'joyn', 'activity_platform'].includes(d))]));

  const targetAccounts = ['sainandhan2212@gmail.com', 'sai2005gaming@gmail.com'];

  console.log('\n==================================================');
  console.log('[2. DATABASE COMPARISON MATRIX]');
  console.log('==================================================\n');

  const collectionsToCount = [
    'users',
    'activities',
    'messages',
    'notifications',
    'joinrequests',
    'ratings',
    'refreshtokens',
    'otps'
  ];

  const dbSummary = {};

  for (const dbName of targetDbs) {
    const db = client.db(dbName);
    const dbCols = (await db.listCollections().toArray()).map(c => c.name);

    const counts = {};
    for (const colName of collectionsToCount) {
      if (dbCols.includes(colName)) {
        counts[colName] = await db.collection(colName).countDocuments();
      } else {
        counts[colName] = 0;
      }
    }

    // Check specific target accounts
    const accountStatus = {};
    if (dbCols.includes('users')) {
      for (const email of targetAccounts) {
        const found = await db.collection('users').findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
        accountStatus[email] = found ? `YES (ID: ${found._id})` : 'NO';
      }
    } else {
      for (const email of targetAccounts) {
        accountStatus[email] = 'NO (Collection missing)';
      }
    }

    dbSummary[dbName] = { counts, accountStatus };
  }

  // Print Comparison Table
  console.log('| Database | users | activities | messages | notifications | joinrequests | ratings | refreshtokens | otps |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const dbName of Object.keys(dbSummary)) {
    const c = dbSummary[dbName].counts;
    console.log(`| **${dbName}** | ${c.users} | ${c.activities} | ${c.messages} | ${c.notifications} | ${c.joinrequests} | ${c.ratings} | ${c.refreshtokens} | ${c.otps} |`);
  }

  console.log('\n==================================================');
  console.log('[3. SPECIFIC ACCOUNT SEARCH RESULTS]');
  console.log('==================================================\n');

  for (const email of targetAccounts) {
    console.log(`Account: "${email}"`);
    for (const dbName of Object.keys(dbSummary)) {
      console.log(`  - Database "${dbName}": ${dbSummary[dbName].accountStatus[email]}`);
    }
  }

  // Also search ALL collections in ALL databases on the connection for any document mentioning the emails
  console.log('\n==================================================');
  console.log('[4. DEEP SEARCH ACROSS ALL DATABASES FOR EMAIL REFERENCES]');
  console.log('==================================================\n');

  for (const dbName of dbList) {
    // Skip system dbs
    if (['admin', 'local', 'config'].includes(dbName)) continue;
    const db = client.db(dbName);
    const cols = await db.listCollections().toArray();
    for (const col of cols) {
      for (const email of targetAccounts) {
        const match = await db.collection(col.name).findOne({
          $or: [
            { email: { $regex: email, $options: 'i' } },
            { contact: { $regex: email, $options: 'i' } },
            { target: { $regex: email, $options: 'i' } },
            { content: { $regex: email, $options: 'i' } }
          ]
        });
        if (match) {
          console.log(`FOUND REFERENCE: Database "${dbName}" -> Collection "${col.name}" -> Doc ID ${match._id}`);
        }
      }
    }
  }

  await mongoose.disconnect();
  console.log('\n==================================================');
  console.log('--- READ-ONLY COMPARISON COMPLETE ---');
  console.log('==================================================');
}

compareDatabases().catch(err => {
  console.error('Comparison error:', err);
  process.exit(1);
});
