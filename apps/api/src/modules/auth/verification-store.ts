export interface VerificationRecord {
  code: string;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
}

export class VerificationStore {
  private store = new Map<string, VerificationRecord>();

  constructor() {
    // Periodically prune expired entries every 5 minutes
    const timer = setInterval(() => {
      this.pruneExpired();
    }, 5 * 60 * 1000);
    if (timer.unref) {
      timer.unref(); // Avoid keeping Node process alive in tests or workers
    }
  }

  /**
   * Store or overwrite a 6-digit OTP code for a normalized email address.
   * Default TTL is 24 hours (matching transactional email copy).
   */
  saveCode(email: string, code: string, ttlMs: number = 24 * 60 * 60 * 1000): void {
    const cleanEmail = email.toLowerCase().trim();
    this.store.set(cleanEmail, {
      code: code.trim(),
      expiresAt: new Date(Date.now() + ttlMs),
      createdAt: new Date(),
      attempts: 0,
    });
  }

  /**
   * Retrieve active code without consuming (used for inspection or test assertions)
   */
  getCode(email: string): string | null {
    const cleanEmail = email.toLowerCase().trim();
    const record = this.store.get(cleanEmail);
    if (!record) return null;
    if (record.expiresAt < new Date()) {
      this.store.delete(cleanEmail);
      return null;
    }
    return record.code;
  }

  /**
   * Validate a submitted code against the stored record for an email.
   * Consumes code on success to prevent reuse.
   */
  verifyCode(
    email: string,
    code: string
  ): { valid: boolean; reason?: 'INVALID' | 'EXPIRED' | 'MAX_ATTEMPTS' | 'MISMATCH' } {
    const cleanEmail = email.toLowerCase().trim();
    const record = this.store.get(cleanEmail);

    if (!record) {
      return { valid: false, reason: 'INVALID' };
    }

    if (record.expiresAt < new Date()) {
      this.store.delete(cleanEmail);
      return { valid: false, reason: 'EXPIRED' };
    }

    if (record.attempts >= 5) {
      this.store.delete(cleanEmail);
      return { valid: false, reason: 'MAX_ATTEMPTS' };
    }

    if (record.code !== code.trim()) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        this.store.delete(cleanEmail);
        return { valid: false, reason: 'MAX_ATTEMPTS' };
      }
      return { valid: false, reason: 'MISMATCH' };
    }

    // Successfully validated: consume single-use code immediately
    this.store.delete(cleanEmail);
    return { valid: true };
  }

  /**
   * Invalidate any pending verification code for an email address.
   */
  invalidateCode(email: string): void {
    const cleanEmail = email.toLowerCase().trim();
    this.store.delete(cleanEmail);
  }

  /**
   * Clear all records (useful for test isolation)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Prune stale expired records from memory
   */
  private pruneExpired(): void {
    const now = new Date();
    for (const [email, record] of this.store.entries()) {
      if (record.expiresAt < now) {
        this.store.delete(email);
      }
    }
  }
}

export const verificationStore = new VerificationStore();
