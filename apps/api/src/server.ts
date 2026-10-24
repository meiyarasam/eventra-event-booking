import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase, prisma, isDatabaseConnected } from './config/database';
import { ReservationStatus } from '@eventra/shared';

const PORT = env.PORT || 5000;

// Periodic cleanup worker for expired inventory reservations
function startReservationCleanupWorker() {
  const CLEANUP_INTERVAL_MS = 60 * 1000; // run every 60 seconds

  const intervalId = setInterval(async () => {
    if (!isDatabaseConnected) return;
    try {
      const now = new Date();
      const result = await prisma.inventoryReservation.updateMany({
        where: {
          status: ReservationStatus.ACTIVE,
          expiresAt: { lte: now },
        },
        data: {
          status: ReservationStatus.EXPIRED,
        },
      });

      if (result.count > 0) {
        console.log(`[Worker] Expired ${result.count} stale ticket reservation(s) and released inventory.`);
      }
    } catch {
      // Ignore background cleanup failures if db connection is momentarily paused
    }
  }, CLEANUP_INTERVAL_MS);

  return intervalId;
}

async function startServer() {
  await connectDatabase();

  const cleanupWorker = startReservationCleanupWorker();

  const server = app.listen(PORT, () => {
    console.log(`
=============================================================
  EVENTRA REST API Service
  Environment: ${env.NODE_ENV}
  Server URL:  http://localhost:${PORT}
  API Prefix:  http://localhost:${PORT}${env.API_PREFIX}
  Swagger UI:  http://localhost:${PORT}${env.API_PREFIX}/docs
  Health:      http://localhost:${PORT}${env.API_PREFIX}/health
=============================================================
    `);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    clearInterval(cleanupWorker);

    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('Database connection pool terminated.');
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
