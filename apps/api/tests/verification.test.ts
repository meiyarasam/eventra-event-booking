import { authService } from '../src/modules/auth/auth.service';
import { verificationStore } from '../src/modules/auth/verification-store';
import { devFallbackStore } from '../src/config/dev-fallback-store';

describe('Email Verification & Mock Flow Tests', () => {
  beforeEach(async () => {
    verificationStore.clear();
    await devFallbackStore.init();
    delete process.env.ENABLE_DEMO_OTP;
  });

  afterAll(() => {
    verificationStore.clear();
  });

  describe('VerificationStore Unit Operations', () => {
    it('stores a verification code and verifies it with the exact matching code', () => {
      const email = 'test.attendee@example.com';
      verificationStore.saveCode(email, '123456');

      const result = verificationStore.verifyCode(email, '123456');
      expect(result.valid).toBe(true);

      // Verify code is single-use and consumed
      const secondAttempt = verificationStore.verifyCode(email, '123456');
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.reason).toBe('INVALID');
    });

    it('rejects an incorrect verification code and tracks attempts', () => {
      const email = 'mismatch@example.com';
      verificationStore.saveCode(email, '123456');

      const result = verificationStore.verifyCode(email, '999999');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MISMATCH');
    });

    it('rejects an expired verification code', () => {
      const email = 'expired@example.com';
      // Set TTL to -1ms (already expired)
      verificationStore.saveCode(email, '123456', -1);

      const result = verificationStore.verifyCode(email, '123456');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('invalidates verification code after max attempts (5)', () => {
      const email = 'bruteforce@example.com';
      verificationStore.saveCode(email, '123456');

      for (let i = 0; i < 4; i++) {
        const res = verificationStore.verifyCode(email, '000000');
        expect(res.valid).toBe(false);
        expect(res.reason).toBe('MISMATCH');
      }

      // 5th failed attempt should trigger MAX_ATTEMPTS and delete the code
      const fifthRes = verificationStore.verifyCode(email, '000000');
      expect(fifthRes.valid).toBe(false);
      expect(fifthRes.reason).toBe('MAX_ATTEMPTS');

      // Subsequent attempt with even the right code should fail as code was purged
      const afterRes = verificationStore.verifyCode(email, '123456');
      expect(afterRes.valid).toBe(false);
      expect(afterRes.reason).toBe('INVALID');
    });
  });

  describe('AuthService Mock Email Verification End-to-End', () => {
    const testEmail = 'verify.user@example.com';
    const testPassword = 'SecurePassword123!';

    beforeEach(async () => {
      // Remove any existing test user in fallback store
      devFallbackStore.users = devFallbackStore.users.filter(
        (u) => u.email.toLowerCase() !== testEmail.toLowerCase()
      );
    });

    // Requirement 1 & 2: Correct mock code 123456 verifies any registered account
    it('Requirement 1 & 2: verifies any registered user successfully with the fixed mock code 123456', async () => {
      const reg = await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      expect(reg.user.emailVerified).toBe(false);

      // Submit verification with fixed code 123456
      const result = await authService.verifyEmail('123456', testEmail);
      expect(result.success).toBe(true);
      expect(result.user.emailVerified).toBe(true);
    });

    // Requirement 5: Reject all other verification codes
    it('Requirement 5: rejects incorrect verification codes with 400 Bad Request', async () => {
      await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      await expect(
        authService.verifyEmail('999999', testEmail)
      ).rejects.toThrow('Invalid verification code');

      await expect(
        authService.verifyEmail('000000', testEmail)
      ).rejects.toThrow('Invalid verification code');
    });

    // Requirement 9 & 10: Reject missing or unregistered accounts
    it('Requirement 9 & 10: rejects verification for missing or unregistered accounts with 404 Not Found', async () => {
      await expect(
        authService.verifyEmail('123456', 'unregistered.user@example.com')
      ).rejects.toThrow('Account not found');
    });

    it('rejects verification if email is not provided when submitting a 6-digit code', async () => {
      await expect(
        authService.verifyEmail('123456')
      ).rejects.toThrow('Email address is required for verification.');
    });

    // Requirement 4 & Persistence: Verify persistent update of User.emailVerified
    it('Requirement 4: successfully persists emailVerified state across subsequent lookups', async () => {
      const reg = await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      await authService.verifyEmail('123456', testEmail);

      // Verify that user profile reflects emailVerified = true in subsequent lookup
      const me = await authService.getMe(reg.user.id);
      expect(me.emailVerified).toBe(true);
    });

    // Requirement 6: Resend-code endpoint works consistently with mock verification
    it('Requirement 6: resend-code endpoint dispatches 123456 without depending on an email provider', async () => {
      await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      // Trigger resend
      const resendRes = await authService.resendVerification(testEmail);
      expect(resendRes.success).toBe(true);
      expect(resendRes.devOtp).toBe('123456');

      // Submitting 123456 verifies the account
      const verifyRes = await authService.verifyEmail('123456', testEmail);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user.emailVerified).toBe(true);

      // Resending for already verified email returns notice
      const alreadyVerifiedRes = await authService.resendVerification(testEmail);
      expect(alreadyVerifiedRes.success).toBe(true);
      expect(alreadyVerifiedRes.message).toContain('already verified');
    });

    it('rejects resend-verification for an unregistered email with 404 Not Found', async () => {
      await expect(
        authService.resendVerification('ghost.account@example.com')
      ).rejects.toThrow('No account found with this email address.');
    });

    // Cryptographic JWT token link verification test
    it('verifies user via signed cryptographic token link (URL click simulation)', async () => {
      const reg = await authService.register({
        name: 'Token User',
        email: 'token.user@example.com',
        password: testPassword,
      });

      // reg.devVerificationToken contains the signed JWT
      expect(reg.devVerificationToken).toBeDefined();

      const verifyRes = await authService.verifyEmail(reg.devVerificationToken!);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user.emailVerified).toBe(true);
    });
  });
});
