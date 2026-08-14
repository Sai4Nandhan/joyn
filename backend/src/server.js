import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initRoomSocket } from './sockets/room.socket.js';
import { Activity } from './models/Activity.js';

async function start() {
  await connectDB();
  try {
    await Activity.syncIndexes();
    console.log('[db] Activity 2dsphere indexes synced successfully');
  } catch (idxErr) {
    console.warn('[db] Activity syncIndexes warning:', idxErr.message);
  }

  const httpServer = http.createServer(app);
  initRoomSocket(httpServer);

  const server = httpServer.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('[unhandled rejection]', err);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown on SIGTERM (used by most cloud hosts on deploy/stop)
  process.on('SIGTERM', () => {
    console.log('[server] SIGTERM received, closing server gracefully...');
    server.close(() => {
      console.log('[server] HTTP server closed. Exiting.');
      process.exit(0);
    });
  });

  // Graceful shutdown on Ctrl+C (development)
  process.on('SIGINT', () => {
    console.log('[server] SIGINT received, closing server gracefully...');
    server.close(() => process.exit(0));
  });
}

start();
