import app from '../src/app';
import { connectDatabase } from '../src/config/database';

// In serverless environments, establish database connection lazily
connectDatabase().catch((err) => {
  console.warn('⚠️ Serverless database connection warning:', (err as Error).message);
});

export default app;
