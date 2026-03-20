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
