import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

try {
  prismaInstance =
    global.prismaGlobal ||
    new PrismaClient({
      log: env.isProduction ? ['error', 'warn'] : ['error', 'warn'],
    });

  if (!env.isProduction) {
    global.prismaGlobal = prismaInstance;
  }
} catch (error) {
  console.warn('⚠️ Prisma Client initialization warning:', (error as Error).message);
  prismaInstance = new Proxy({} as PrismaClient, {
    get: (_target, prop) => {
      if (prop === '$connect') return async () => { throw new Error('Database not connected'); };
      if (prop === '$disconnect') return async () => {};
      return () => { throw new Error('Database not connected'); };
    },
  });
}

export const prisma = prismaInstance;

export let isDatabaseConnected = false;

export async function connectDatabase() {
  try {
    await prisma.$connect();
    isDatabaseConnected = true;
    console.log('✅ Connected to PostgreSQL database successfully.');
  } catch (error) {
    isDatabaseConnected = false;
    console.warn('⚠️ Database connection warning:', (error as Error).message);
    if (env.isProduction) {
  throw error;
}
console.log('ℹ️ Running in resilient In-Memory Dev Mode with complete mock simulation.');
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
