import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  COOKIE_DOMAIN:
    process.env.COOKIE_DOMAIN &&
    process.env.COOKIE_DOMAIN !== 'localhost' &&
    process.env.COOKIE_DOMAIN !== 'undefined'
      ? process.env.COOKIE_DOMAIN
      : undefined,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'eventra_development_jwt_secret_min_32_characters_long_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'eventra_development_refresh_jwt_secret_min_32_characters_long_67890',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin Eventra',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@eventra.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  ORGANIZER_NAME: process.env.ORGANIZER_NAME || 'Sarah Organizer',
  ORGANIZER_EMAIL: process.env.ORGANIZER_EMAIL || 'organizer@eventra.com',
  ORGANIZER_PASSWORD: process.env.ORGANIZER_PASSWORD || 'OrganizerPassword123!',
  ATTENDEE_NAME: process.env.ATTENDEE_NAME || 'Alex Attendee',
  ATTENDEE_EMAIL: process.env.ATTENDEE_EMAIL || 'attendee@eventra.com',
  ATTENDEE_PASSWORD: process.env.ATTENDEE_PASSWORD || 'AttendeePassword123!',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  isProduction: process.env.NODE_ENV === 'production',
  mockEmailVerification:
    process.env.MOCK_EMAIL_VERIFICATION === 'true' ||
    process.env.ENABLE_DEMO_OTP === 'true' ||
    (process.env.NODE_ENV !== 'production' &&
      process.env.MOCK_EMAIL_VERIFICATION !== 'false' &&
      process.env.ENABLE_DEMO_OTP !== 'false'),
};

export function isMockEmailVerificationEnabled(): boolean {
  if (process.env.MOCK_EMAIL_VERIFICATION === 'true' || process.env.ENABLE_DEMO_OTP === 'true') {
    return true;
  }
  if (process.env.MOCK_EMAIL_VERIFICATION === 'false' || process.env.ENABLE_DEMO_OTP === 'false') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}
