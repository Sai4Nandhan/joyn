import mongoose from 'mongoose';

async function searchEmail() {
  await mongoose.connect('mongodb://127.0.0.1:27017/admin');
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();

  for (const dbInfo of dbs.databases) {
    if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
    const db = mongoose.connection.useDb(dbInfo.name);
    const cols = await db.db.listCollections().toArray();
    for (const c of cols) {
      if (c.name === 'users') {
        const users = await db.db.collection('users').find({}).toArray();
        console.log('DB:', dbInfo.name, 'Users:', users.map(u => ({ id: u._id, email: u.email, name: u.name })));
      }
    }
  }
  process.exit(0);
}
searchEmail().catch(console.error);
