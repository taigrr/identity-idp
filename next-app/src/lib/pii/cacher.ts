/**
 * PII Cacher - Cache encrypted PII in session
 * Mirrors: app/services/pii/cacher.rb
 */

import type { PiiAttributes } from './types';
import { createPiiAttributesFromJson, piiAttributesToJson } from './attributes';
import { SessionEncryptor } from '../encryption/session-encryptor';
import { isStale as isFingerprintStale } from './fingerprinter';

/**
 * User session interface for PII caching
 */
export interface UserSession {
  encrypted_profiles?: Record<string, string>;
}

/**
 * Profile interface for PII decryption
 */
export interface Profile {
  id: string;
  ssn_signature?: string;
  name_zip_birth_year_signature?: string;
  decrypt_pii?: (password: string) => PiiAttributes | null;
}

/**
 * User interface for cacher
 */
export interface User {
  active_profile?: Profile;
}

/**
 * Analytics interface for tracking events
 */
export interface Analytics {
  fingerprints_rotated?: () => void;
}

/**
 * PII Cacher class
 */
export class PiiCacher {
  private user: User;
  private userSession: UserSession;
  private analytics?: Analytics;
  private sessionEncryptor: SessionEncryptor;

  constructor(user: User, userSession: UserSession, analytics?: Analytics) {
    this.user = user;
    this.userSession = userSession;
    this.analytics = analytics;
    this.sessionEncryptor = new SessionEncryptor();
  }

  /**
   * Save decrypted PII to session (encrypted)
   */
  async save(userPassword: string, profile?: Profile): Promise<PiiAttributes | null> {
    const targetProfile = profile ?? this.user.active_profile;
    if (!targetProfile?.decrypt_pii) {
      return null;
    }

    const decryptedPii = targetProfile.decrypt_pii(userPassword);
    if (!decryptedPii) {
      return null;
    }

    await this.saveDecryptedPii(decryptedPii, targetProfile.id);
    await this.rotateIfStale(targetProfile, decryptedPii);

    return decryptedPii;
  }

  /**
   * Save already decrypted PII to session
   */
  async saveDecryptedPii(decryptedPii: PiiAttributes, profileId: string): Promise<void> {
    const piiJson = piiAttributesToJson(decryptedPii);
    const kmsEncryptedPii = await this.sessionEncryptor.kmsEncrypt(piiJson);

    if (!this.userSession.encrypted_profiles) {
      this.userSession.encrypted_profiles = {};
    }

    this.userSession.encrypted_profiles[profileId] = kmsEncryptedPii;
  }

  /**
   * Fetch decrypted PII from session
   */
  async fetch(profileId: string): Promise<PiiAttributes | null> {
    if (!this.userSession.encrypted_profiles) {
      return null;
    }

    const encryptedProfilePii = this.userSession.encrypted_profiles[profileId];
    if (!encryptedProfilePii) {
      return null;
    }

    try {
      const decryptedPiiJson = await this.sessionEncryptor.kmsDecrypt(encryptedProfilePii);
      return createPiiAttributesFromJson(decryptedPiiJson);
    } catch {
      return null;
    }
  }

  /**
   * Check if PII exists in session
   */
  existsInSession(): boolean {
    return !!this.userSession.encrypted_profiles &&
           Object.keys(this.userSession.encrypted_profiles).length > 0;
  }

  /**
   * Delete PII from session
   */
  delete(): void {
    delete this.userSession.encrypted_profiles;
  }

  /**
   * Rotate fingerprints if stale
   */
  private async rotateIfStale(profile: Profile, pii: PiiAttributes): Promise<void> {
    if (!profile || !pii) {
      return;
    }

    const normalizedPii = this.normalizeSSn(pii);

    if (this.isStaleFingerprints(profile, normalizedPii)) {
      this.analytics?.fingerprints_rotated?.();
      // Actual rotation would be done via KeyRotator service
      // This is a placeholder for the rotation logic
    }
  }

  /**
   * Check if fingerprints are stale
   */
  private isStaleFingerprints(profile: Profile, pii: PiiAttributes): boolean {
    return this.isStaleSsnSignature(profile, pii) ||
           this.isStaleCompoundPiiSignature(profile, pii);
  }

  /**
   * Check if SSN signature is stale
   */
  private isStaleSsnSignature(profile: Profile, pii: PiiAttributes): boolean {
    if (!profile || !pii.ssn) {
      return false;
    }
    return isFingerprintStale(pii.ssn, profile.ssn_signature);
  }

  /**
   * Check if compound PII signature is stale
   */
  private isStaleCompoundPiiSignature(profile: Profile, pii: PiiAttributes): boolean {
    if (!profile || !pii) {
      return false;
    }
    const compoundPii = this.buildCompoundPii(pii);
    if (!compoundPii) {
      return false;
    }
    return isFingerprintStale(compoundPii, profile.name_zip_birth_year_signature);
  }

  /**
   * Build compound PII for fingerprinting
   */
  private buildCompoundPii(pii: PiiAttributes): string | null {
    const lastName = pii.last_name?.toLowerCase();
    const zipcode = pii.zipcode?.slice(0, 5);
    const birthYear = pii.dob?.slice(0, 4);

    if (!lastName || !zipcode || !birthYear) {
      return null;
    }

    return `${lastName}:${zipcode}:${birthYear}`;
  }

  /**
   * Normalize SSN (remove dashes)
   */
  private normalizeSSn(pii: PiiAttributes): PiiAttributes {
    return {
      ...pii,
      ssn: pii.ssn?.replace(/\D/g, ''),
    };
  }
}

/**
 * Create PII Cacher
 */
export function createPiiCacher(
  user: User,
  userSession: UserSession,
  analytics?: Analytics
): PiiCacher {
  return new PiiCacher(user, userSession, analytics);
}
