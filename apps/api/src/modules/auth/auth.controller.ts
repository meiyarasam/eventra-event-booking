import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { setAuthCookies, clearAuthCookies } from '../../utils/jwt';
import { AppError } from '../../utils/app-error';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // FIX BUG-003: devOtp and devVerificationToken are only included in non-production responses.
      const isDev = process.env.NODE_ENV !== 'production';
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          ...(isDev ? { devOtp: result.devOtp, devVerificationToken: result.devVerificationToken } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        throw AppError.unauthorized('No refresh token provided');
      }

      const result = await authService.refreshToken(token);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const user = await authService.getMe(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      // FIX BUG-003 & BUG-015: Only expose devToken in non-production environments.
      // In production, always return the same response shape regardless of outcome
      // to prevent timing/status-code based email enumeration.
      res.status(200).json({
        success: true,
        message: result.message,
        ...(process.env.NODE_ENV !== 'production' && result.devToken ? { devToken: result.devToken } : {}),
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenOrOtp, email } = req.body;
      const result = await authService.verifyEmail(tokenOrOtp, email || req.user?.email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body.email || req.user?.email;
      if (!email) {
        throw AppError.badRequest('Email address is required.');
      }
      const result = await authService.resendVerification(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
