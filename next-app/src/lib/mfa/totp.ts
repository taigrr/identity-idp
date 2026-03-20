/**
 * TOTP (Time-based One-Time Password) Service
 * Mirrors: app/services/db/auth_app_configuration.rb
 *
 * Uses the otpauth library which is compatible with Google Authenticator,
 * Authy, and other TOTP apps.
 */

import * as OTPAuth from 'otpauth';

const OTP_LENGTH = 6;
const TOTP_INTERVAL = 30; // seconds
const ALLOWED_DRIFT_SECONDS = 30;

export interface TotpConfig {
  id: number;
  userId: number;
  otpSecretKey: string;
  name: string;
  totpTimestamp: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generates a new TOTP secret
 */
export function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generates a TOTP URI for QR code scanning
 */
export function generateTotpUri(
  secret: string,
  email: string,
  issuer: string = 'Login.gov'
): string {
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: 'SHA1',
    digits: OTP_LENGTH,
    period: TOTP_INTERVAL,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.toString();
}

/**
 * Verifies a TOTP code against a secret
 * Returns the timestamp if valid, null if invalid
 */
export function verifyTotpCode(
  secret: string,
  code: string,
  lastTimestamp: number | null = null
): number | null {
  // Clean code - remove spaces
  const cleanCode = code.replace(/\s/g, '');

  // Validate code format
  if (!/^\d{6}$/.test(cleanCode)) {
    return null;
  }

  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: OTP_LENGTH,
    period: TOTP_INTERVAL,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Calculate allowed window based on drift
  const window = Math.ceil(ALLOWED_DRIFT_SECONDS / TOTP_INTERVAL);

  // Verify with drift tolerance
  const delta = totp.validate({ token: cleanCode, window });

  if (delta === null) {
    return null;
  }

  // Calculate the actual timestamp used
  const currentTime = Math.floor(Date.now() / 1000);
  const newTimestamp = Math.floor(currentTime / TOTP_INTERVAL) + delta;

  // Prevent replay attacks - ensure timestamp is newer than last used
  if (lastTimestamp !== null && newTimestamp <= lastTimestamp) {
    return null;
  }

  return newTimestamp;
}

/**
 * Generates the current TOTP code (for testing)
 */
export function generateCurrentCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: OTP_LENGTH,
    period: TOTP_INTERVAL,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
}

/**
 * Authenticates user with TOTP code against their configurations
 * Mirrors: Db::AuthAppConfiguration.authenticate
 */
export async function authenticateTotp(
  configs: TotpConfig[],
  code: string,
  updateTimestamp: (configId: number, timestamp: number) => Promise<void>
): Promise<TotpConfig | null> {
  for (const config of configs) {
    const newTimestamp = verifyTotpCode(
      config.otpSecretKey,
      code,
      config.totpTimestamp
    );

    if (newTimestamp !== null) {
      await updateTimestamp(config.id, newTimestamp);
      return config;
    }
  }

  return null;
}
