/**
 * Auth App (TOTP) Configuration Service
 * Mirrors: app/services/db/auth_app_configuration.rb
 *
 * Provides CRUD operations for TOTP authenticator configurations.
 */

import { eq, and } from 'drizzle-orm';
import { db, authAppConfigurations, type AuthAppConfiguration } from '@/db';
import { verifyTotpCode } from '@/lib/mfa/totp';
import { encrypt, decrypt } from '@/lib/encryption';

export interface CreateAuthAppParams {
  userId: number;
  otpSecretKey: string;
  name?: string;
}

/**
 * Creates a new auth app configuration for a user.
 * Mirrors: Db::AuthAppConfiguration.create
 */
export async function createAuthAppConfiguration(
  params: CreateAuthAppParams
): Promise<AuthAppConfiguration> {
  const { userId, otpSecretKey, name = new Date().toISOString() } = params;
  const now = new Date();

  // Encrypt the OTP secret key before storage
  const encryptedOtpSecretKey = await encrypt(otpSecretKey);

  const [config] = await db
    .insert(authAppConfigurations)
    .values({
      userId,
      encryptedOtpSecretKey,
      name,
      totpTimestamp: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return config;
}

/**
 * Gets all auth app configurations for a user.
 */
export async function getUserAuthAppConfigurations(
  userId: number
): Promise<AuthAppConfiguration[]> {
  return db.query.authAppConfigurations.findMany({
    where: eq(authAppConfigurations.userId, userId),
  });
}

/**
 * Gets a specific auth app configuration by ID.
 */
export async function getAuthAppConfiguration(
  id: number
): Promise<AuthAppConfiguration | null> {
  const config = await db.query.authAppConfigurations.findFirst({
    where: eq(authAppConfigurations.id, id),
  });
  return config ?? null;
}

/**
 * Authenticates a user's TOTP code against their auth app configurations.
 * Returns the matching configuration if valid, null otherwise.
 * Mirrors: Db::AuthAppConfiguration.authenticate
 */
export async function authenticateAuthApp(
  userId: number,
  code: string
): Promise<AuthAppConfiguration | null> {
  const configs = await getUserAuthAppConfigurations(userId);

  for (const config of configs) {
    // Decrypt the secret for verification
    const otpSecretKey = await decrypt(config.encryptedOtpSecretKey);

    const newTimestamp = verifyTotpCode(
      otpSecretKey,
      code,
      config.totpTimestamp
    );

    if (newTimestamp !== null) {
      // Update the timestamp to prevent replay attacks
      await updateAuthAppTimestamp(config.id, newTimestamp);
      return config;
    }
  }

  return null;
}

/**
 * Confirms a TOTP code during setup (without requiring an existing config).
 * Mirrors: Db::AuthAppConfiguration.confirm
 */
export async function confirmAuthAppSetup(
  secret: string,
  code: string
): Promise<number | null> {
  return verifyTotpCode(secret, code, null);
}

/**
 * Updates the TOTP timestamp for a configuration (prevents replay attacks).
 */
export async function updateAuthAppTimestamp(
  configId: number,
  timestamp: number
): Promise<void> {
  await db
    .update(authAppConfigurations)
    .set({
      totpTimestamp: timestamp,
      updatedAt: new Date(),
    })
    .where(eq(authAppConfigurations.id, configId));
}

/**
 * Deletes an auth app configuration.
 */
export async function deleteAuthAppConfiguration(
  userId: number,
  configId: number
): Promise<boolean> {
  const result = await db
    .delete(authAppConfigurations)
    .where(
      and(
        eq(authAppConfigurations.id, configId),
        eq(authAppConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Renames an auth app configuration.
 */
export async function renameAuthAppConfiguration(
  userId: number,
  configId: number,
  newName: string
): Promise<boolean> {
  const result = await db
    .update(authAppConfigurations)
    .set({
      name: newName,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(authAppConfigurations.id, configId),
        eq(authAppConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Counts auth app configurations for a user.
 */
export async function countAuthAppConfigurations(userId: number): Promise<number> {
  const configs = await getUserAuthAppConfigurations(userId);
  return configs.length;
}
