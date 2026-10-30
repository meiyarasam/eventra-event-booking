import { authService } from '../src/modules/auth/auth.service';
import { verificationStore } from '../src/modules/auth/verification-store';
import { devFallbackStore } from '../src/config/dev-fallback-store';

describe('Email Verification & Security Tests', () => {
  beforeEach(async () => {
    verificationStore.clear();
    await devFallbackStore.init();
    // Ensure clean environment for each test
    delete process.env.ENABLE_DEMO_OTP;
  });

  afterAll(() => {
    verificationStore.clear();
  });

  describe('VerificationStore Unit Operations', () => {
    it('stores a verification code and verifies it with the exact matching code', () => {
      const email = 'test.attendee@example.com';
      verificationStore.saveCode(email, '654321');

      const result = verificationStore.verifyCode(email, '654321');
      expect(result.valid).toBe(true);

      // Verify code is single-use and consumed
      const secondAttempt = verificationStore.verifyCode(email, '654321');
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.reason).toBe('INVALID');
    });

    it('rejects an incorrect verification code and tracks attempts', () => {
      const email = 'mismatch@example.com';
      verificationStore.saveCode(email, '112233');

      const result = verificationStore.verifyCode(email, '999999');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MISMATCH');
    });

    it('rejects an expired verification code', () => {
      const email = 'expired@example.com';
      // Set TTL to -1ms (already expired)
      verificationStore.saveCode(email, '445566', -1);

      const result = verificationStore.verifyCode(email, '445566');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('invalidates verification code after max attempts (5)', () => {
      const email = 'bruteforce@example.com';
      verificationStore.saveCode(email, '778899');

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
      const afterRes = verificationStore.verifyCode(email, '778899');
      expect(afterRes.valid).toBe(false);
      expect(afterRes.reason).toBe('INVALID');
    });
  });

  describe('AuthService Email Verification End-to-End', () => {
    const testEmail = 'verify.user@example.com';
    const testPassword = 'SecurePassword123!';

    beforeEach(async () => {
      // Remove any existing test user in fallback store
      devFallbackStore.users = devFallbackStore.users.filter(
        (u) => u.email.toLowerCase() !== testEmail.toLowerCase()
      );
    });

    // Requirement 1: Correct, valid verification code
    it('Requirement 1: verifies user successfully with the correct issued code', async () => {
      const reg = await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      expect(reg.user.emailVerified).toBe(false);

      // Retrieve the issued code from verificationStore
      const issuedCode = verificationStore.getCode(testEmail);
      expect(issuedCode).toBeDefined();
      expect(issuedCode).toMatch(/^\d{6}$/);

      // Submit verification with correct code
      const result = await authService.verifyEmail(issuedCode!, testEmail);
      expect(result.success).toBe(true);
      expect(result.user.emailVerified).toBe(true);
    });

    // Requirement 2: Incorrect verification code
    it('Requirement 2: rejects incorrect verification code with 400 Bad Request', async () => {
      await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      await expect(
        authService.verifyEmail('999999', testEmail)
      ).rejects.toThrow('Invalid verification code');
    });

    // Requirement 3: Expired verification code
    it('Requirement 3: rejects expired verification code with appropriate message', async () => {
      await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      // Manually simulate expiration by setting expired TTL
      verificationStore.saveCode(testEmail, '123123', -1000);

      await expect(
        authService.verifyEmail('123123', testEmail)
      ).rejects.toThrow('Verification code has expired. Please request a new one.');
    });

    // Requirement 4: Resend-code behavior
    it('Requirement 4: resending generates a fresh code and invalidates the previous code', async () => {
      await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      const initialCode = verificationStore.getCode(testEmail);
      expect(initialCode).toBeDefined();

      // Trigger resend
      const resendRes = await authService.resendVerification(testEmail);
      expect(resendRes.success).toBe(true);

      const freshCode = verificationStore.getCode(testEmail);
      expect(freshCode).toBeDefined();

      // Old code must now fail
      await expect(
        authService.verifyEmail(initialCode!, testEmail)
      ).rejects.toThrow('Invalid verification code');

      // Fresh code must succeed
      const verifyRes = await authService.verifyEmail(freshCode!, testEmail);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user.emailVerified).toBe(true);
    });

    // Requirement 5: Successful persistence of User.emailVerified
    it('Requirement 5: successfully persists emailVerified state across subsequent lookups', async () => {
      const reg = await authService.register({
        name: 'Verify User',
        email: testEmail,
        password: testPassword,
      });

      const issuedCode = verificationStore.getCode(testEmail);
      await authService.verifyEmail(issuedCode!, testEmail);

      // Verify that user profile reflects emailVerified = true
      const me = await authService.getMe(reg.user.id);
      expect(me.emailVerified).toBe(true);
    });

    // Requirement 6: Production mode does not accept demo code without a valid issued code
    it('Requirement 6: production mode rejects demo code 123456 for real accounts without valid issued code', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DEMO_OTP;

      try {
        await authService.register({
          name: 'Real Production User',
          email: 'real.user@example.com',
          password: testPassword,
        });

        // In production, entering arbitrary 123456 must be rejected
        await expect(
          authService.verifyEmail('123456', 'real.user@example.com')
        ).rejects.toThrow('Invalid verification code');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    // Requirement 7: Verification codes cannot be used to verify a different email address
    it('Requirement 7: verification codes cannot be used to verify a different email address', async () => {
      const emailAlice = 'alice@example.com';
      const emailBob = 'bob@example.com';

      await authService.register({
        name: 'Alice User',
        email: emailAlice,
        password: testPassword,
      });

      await authService.register({
        name: 'Bob User',
        email: emailBob,
        password: testPassword,
      });

      const aliceCode = verificationStore.getCode(emailAlice);
      expect(aliceCode).toBeDefined();

      // Attempting to verify Bob with Alice's code must fail
      await expect(
        authService.verifyEmail(aliceCode!, emailBob)
      ).rejects.toThrow('Invalid verification code');

      // Alice should still be unverified
      const fbAlice = devFallbackStore.users.find((u) => u.email === emailAlice);
      expect(fbAlice?.emailVerified).toBe(false);

      // Alice verifying with her own code must succeed
      const aliceVerify = await authService.verifyEmail(aliceCode!, emailAlice);
      expect(aliceVerify.success).toBe(true);
      expect(aliceVerify.user.emailVerified).toBe(true);
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

