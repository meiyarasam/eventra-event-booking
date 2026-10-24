import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';
import { AppError } from '../src/utils/app-error';
import { UserRole, AccountStatus, RegisterSchema, LoginSchema } from '@eventra/shared';
import bcrypt from 'bcryptjs';

describe('Authentication & Security Unit Tests', () => {
  describe('Schema Validation', () => {
    it('validates correct registration inputs', () => {
      const valid = {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: 'Password123!',
      };
      const result = RegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const invalid = {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: 'Short1',
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects passwords without an uppercase letter', () => {
      const invalid = {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: 'password123!',
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter');
      }
    });

    it('rejects invalid email formats', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'Password123!',
      };
      const result = LoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('JWT Signature and Verification', () => {
    it('generates a valid JWT token that can be decoded with userId and role', () => {
      const payload = {
        userId: 'user-uuid-123',
        role: UserRole.ATTENDEE,
        email: 'test@example.com',
      };

      const token = signAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(UserRole.ATTENDEE);
      expect(decoded.email).toBe(payload.email);
    });

    it('throws error when verifying tampered token', () => {
      const payload = {
        userId: 'user-uuid-123',
        role: UserRole.ATTENDEE,
        email: 'test@example.com',
      };
      const token = signAccessToken(payload);
      const tampered = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('Password Hashing Security', () => {
    it('properly hashes and verifies passwords with bcrypt', async () => {
      const rawPassword = 'SecurePassword2026!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      expect(hash).not.toBe(rawPassword);
      expect(await bcrypt.compare(rawPassword, hash)).toBe(true);
      expect(await bcrypt.compare('WrongPassword!', hash)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('creates appropriate AppError instances with status codes', () => {
      const err400 = AppError.badRequest('Invalid parameter');
      expect(err400.statusCode).toBe(400);

      const err401 = AppError.unauthorized();
      expect(err401.statusCode).toBe(401);

      const err403 = AppError.forbidden();
      expect(err403.statusCode).toBe(403);

      const err404 = AppError.notFound();
      expect(err404.statusCode).toBe(404);

      const err409 = AppError.conflict('Already exists');
      expect(err409.statusCode).toBe(409);
    });
  });
});
