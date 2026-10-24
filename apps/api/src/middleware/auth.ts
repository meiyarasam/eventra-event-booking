import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { prisma, isDatabaseConnected } from '../config/database';
import { UserRole, AccountStatus } from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../config/dev-fallback-store';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        status: AccountStatus;
        name: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw AppError.unauthorized('Authentication required: No token provided');
    }

    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Token expired: Please refresh your session');
      }
      throw AppError.unauthorized('Invalid authentication token');
    }

    let user: any = null;
    if (!isDatabaseConnected) {
      await devFallbackStore.init();
      const found = devFallbackStore.users.find((u) => u.id === payload.userId);
      user = found
        ? { id: found.id, email: found.email, role: found.role, status: found.status, name: found.name }
        : {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            status: AccountStatus.ACTIVE,
            name: payload.email.split('@')[0],
          };
    } else {
      try {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, role: true, status: true, name: true },
        });
      } catch (dbError) {
        if (isPrismaConnectionError(dbError)) {
          await devFallbackStore.init();
          const found = devFallbackStore.users.find((u) => u.id === payload.userId);
          user = found
            ? { id: found.id, email: found.email, role: found.role, status: found.status, name: found.name }
            : {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
                status: AccountStatus.ACTIVE,
                name: payload.email.split('@')[0],
              };
        } else {
          throw dbError;
        }
      }
    }

    if (!user) {
      throw AppError.unauthorized('User account no longer exists');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw AppError.forbidden('Your account has been suspended. Please contact support.');
    }

    req.user = user as any;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        let user: any = null;
        try {
          user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, status: true, name: true },
          });
        } catch (dbErr) {
          if (isPrismaConnectionError(dbErr)) {
            await devFallbackStore.init();
            const found = devFallbackStore.users.find((u) => u.id === payload.userId);
            user = found || {
              id: payload.userId,
              email: payload.email,
              role: payload.role,
              status: AccountStatus.ACTIVE,
              name: payload.email.split('@')[0],
            };
          }
        }
        if (user && user.status === AccountStatus.ACTIVE) {
          req.user = user as any;
        }
      } catch {
        // Ignore token errors in optionalAuth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
