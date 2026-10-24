import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: env.isProduction ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!env.isProduction) {
  global.prismaGlobal = prisma;
}

export let isDatabaseConnected = false;

export async function connectDatabase() {
  try {
    await prisma.$connect();
    isDatabaseConnected = true;
    console.log('✅ Connected to PostgreSQL database successfully.');
  } catch (error) {
    isDatabaseConnected = false;
    console.warn('⚠️ Database connection warning:', (error as Error).message);
    console.log('ℹ️ Running in resilient In-Memory Dev Mode with complete mock simulation.');
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
