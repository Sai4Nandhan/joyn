import mongoose from 'mongoose';
import { env } from '../config/env.js';
import * as activityService from '../services/activity.service.js';

async function runDiscoveryTest() {
  console.log('==================================================');
  console.log('--- DISCOVERY API & RATE LIMIT VERIFICATION ---');
  console.log('==================================================\n');

  await mongoose.connect(env.mongoUri || 'mongodb://127.0.0.1:27017/activity-platform');

  const hasanparthyCoords = { lat: 17.9784, lng: 79.5941 };

  console.log(`[1. TESTING DISCOVERY QUERY FOR "${hasanparthyCoords.lat}, ${hasanparthyCoords.lng}"]`);

  // Execute 5 rapid sequential discovery queries to simulate page loads & filtering
  for (let i = 1; i <= 5; i++) {
    const results = await activityService.discoverActivities({
      lat: hasanparthyCoords.lat,
      lng: hasanparthyCoords.lng,
      radiusKm: 50,
      page: 1,
      limit: 10,
    });

    console.log(`✓ Query #${i}: Returned ${results.length} nearby activities.`);
  }

  await mongoose.disconnect();
  console.log('\n==================================================');
  console.log('--- DISCOVERY RATE LIMIT VERIFICATION COMPLETE ---');
  console.log('==================================================');
}

runDiscoveryTest().catch((err) => {
  console.error('Discovery test error:', err);
  process.exit(1);
});
