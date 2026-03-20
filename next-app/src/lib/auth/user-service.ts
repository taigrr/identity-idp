/**
 * User Service - User authentication and lookup operations
 * Mirrors Rails User model methods
 *
 * NOTE: Emails are encrypted in the database. We use email_fingerprint
 * (a non-reversible hash) for lookups, then decrypt the email if needed.
 */

import { eq, and, isNotNull } from 'drizzle-orm';
import { createHash } from 'crypto';
import { db } from '@/db';
import { users, type User } from '@/db/schema/users';
import { emailAddresses } from '@/db/schema/email-addresses';
import { PasswordVerifier, type RegionalDigestPair } from './password-verifier';
import { getConfig } from '../config';

/**
 * Generate email fingerprint for lookups
 * Mirrors Rails: Pii::Fingerprinter.fingerprint
 */
function fingerprintEmail(email: string): string {
  const config = getConfig();
  const normalizedEmail = email.toLowerCase().trim();
  return createHash('sha256')
    .update(normalizedEmail + config.passwordPepper)
    .digest('hex');
}

export class UserService {
  private passwordVerifier: PasswordVerifier;

  constructor() {
    this.passwordVerifier = new PasswordVerifier();
  }

  /**
   * Find user by email (case-insensitive)
   * Mirrors: User.find_with_email
   *
   * Uses email fingerprint for lookup since email is encrypted
   */
  async findByEmail(email: string): Promise<User | null> {
    const fingerprint = fingerprintEmail(email);

    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(emailAddresses, eq(emailAddresses.userId, users.id))
      .where(eq(emailAddresses.emailFingerprint, fingerprint))
      .limit(1);

    return result[0]?.user ?? null;
  }

  /**
   * Find user by email with confirmed email only
   * Mirrors: User.find_with_confirmed_email
   */
  async findByConfirmedEmail(email: string): Promise<User | null> {
    const fingerprint = fingerprintEmail(email);

    const result = await db
      .select({ user: users, emailAddress: emailAddresses })
      .from(users)
      .innerJoin(emailAddresses, eq(emailAddresses.userId, users.id))
      .where(
        and(
          eq(emailAddresses.emailFingerprint, fingerprint),
          isNotNull(emailAddresses.confirmedAt)
        )
      )
      .limit(1);

    return result[0]?.user ?? null;
  }

  /**
   * Find user by UUID
   */
  async findByUuid(uuid: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.uuid, uuid))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Authenticate user with email and password
   * Returns user if credentials are valid, null otherwise
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const digestPair: RegionalDigestPair = {
      multi_region: user.encryptedPasswordDigestMultiRegion ?? undefined,
      single_region: user.encryptedPasswordDigest ?? undefined,
    };

    const isValid = await this.passwordVerifier.verify(
      password,
      digestPair,
      user.uuid
    );

    return isValid ? user : null;
  }

  /**
   * Check if user is locked out
   * Mirrors: user.locked_out?
   */
  isLockedOut(user: User): boolean {
    if (!user.secondFactorLockedAt) {
      return false;
    }

    const lockoutDuration = 24 * 60 * 60 * 1000; // 24 hours
    const lockedAt = new Date(user.secondFactorLockedAt).getTime();
    const now = Date.now();

    return now - lockedAt < lockoutDuration;
  }

  /**
   * Check if user is suspended
   */
  isSuspended(user: User): boolean {
    return !!user.suspendedAt && !user.reinstatedAt;
  }

  /**
   * Check if user has accepted current terms of use
   * Mirrors: user.accepted_rules_of_use_still_valid?
   */
  hasAcceptedTerms(user: User): boolean {
    if (!user.acceptedTermsAt) {
      return false;
    }

    // Terms are valid for 1 year
    const termsValidDuration = 365 * 24 * 60 * 60 * 1000;
    const acceptedAt = new Date(user.acceptedTermsAt).getTime();
    const now = Date.now();

    return now - acceptedAt < termsValidDuration;
  }

  /**
   * Update last sign-in timestamp for email
   */
  async updateLastSignIn(userId: number, email: string): Promise<void> {
    const fingerprint = fingerprintEmail(email);

    await db
      .update(emailAddresses)
      .set({ lastSignInAt: new Date() })
      .where(
        and(
          eq(emailAddresses.userId, userId),
          eq(emailAddresses.emailFingerprint, fingerprint)
        )
      );
  }
}

/**
 * Create user service instance
 */
export function createUserService(): UserService {
  return new UserService();
}

// Singleton instance
let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}

export { fingerprintEmail };
