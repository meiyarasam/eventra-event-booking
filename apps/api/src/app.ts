import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { swaggerDocument } from './docs/swagger';

import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { eventsRoutes } from './modules/events/events.routes';
import { bookingsRoutes } from './modules/bookings/bookings.routes';
import { ticketsRoutes } from './modules/tickets/tickets.routes';
import { organizersRoutes } from './modules/organizers/organizers.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { uploadRoutes } from './modules/upload/upload.routes';
import { aiRoutes } from './modules/ai/ai.routes';

const app: Express = express();

// Trust proxy for Render / Vercel deployment
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Swagger UI compatibility
    crossOriginEmbedderPolicy: false,
  })
);

// Strict CORS configuration supporting credentials
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || !env.isProduction) {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Rate limiting for auth routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 50 : 500,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger Interactive API Documentation
app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Endpoint
app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'eventra-api',
    environment: env.NODE_ENV,
  });
});

// Mount Module Routes
app.use(`${env.API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${env.API_PREFIX}/users`, usersRoutes);
app.use(`${env.API_PREFIX}/categories`, categoriesRoutes);
app.use(`${env.API_PREFIX}/events`, eventsRoutes);
app.use(`${env.API_PREFIX}/bookings`, bookingsRoutes);
app.use(`${env.API_PREFIX}/tickets`, ticketsRoutes);
app.use(`${env.API_PREFIX}/organizer`, organizersRoutes);
app.use(`${env.API_PREFIX}/admin`, adminRoutes);
app.use(`${env.API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${env.API_PREFIX}/upload`, uploadRoutes);
app.use(`${env.API_PREFIX}/ai`, aiRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
