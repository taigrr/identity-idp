/**
 * Auth module - Authentication and session management
 *
 * Provides:
 * - Password verification (scrypt + KMS)
 * - Session management (Redis)
 * - User lookup and authentication
 */

export {
  PasswordVerifier,
  createPasswordVerifier,
  type PasswordDigest,
  type RegionalDigestPair,
} from './password-verifier';

export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
  generateSessionId,
  type SessionData,
} from './session-manager';

export {
  UserService,
  createUserService,
  getUserService,
} from './user-service';

// Remember Device
export {
  RememberDeviceCookie,
  createRememberDeviceCookie,
  parseRememberDeviceCookie,
  COOKIE_ROLE,
} from './remember-device';

// Email Normalizer
export {
  normalizeEmail,
  normalizeEmailAsync,
  extractEmailParts,
  isValidEmailFormat,
} from './email-normalizer';
