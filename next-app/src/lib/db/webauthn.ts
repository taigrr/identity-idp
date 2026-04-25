/**
 * WebAuthn Configuration Service
 * Mirrors: app/models/webauthn_configuration.rb
 *
 * Handles WebAuthn (security keys, passkeys) configuration management.
 */

import { eq, and } from 'drizzle-orm';
import { db, webauthnConfigurations, type WebauthnConfiguration } from '@/db';

export interface CreateWebauthnParams {
  userId: number;
  name: string;
  credentialId: string;
  credentialPublicKey: string;
  platformAuthenticator?: boolean;
  transports?: string[];
  authenticatorDataFlags?: Record<string, boolean>;
  aaguid?: string;
}

/**
 * Creates a new WebAuthn configuration.
 */
export async function createWebauthnConfiguration(
  params: CreateWebauthnParams
): Promise<WebauthnConfiguration> {
  const {
    userId,
    name,
    credentialId,
    credentialPublicKey,
    platformAuthenticator,
    transports,
    authenticatorDataFlags,
    aaguid,
  } = params;

  const now = new Date();

  const [config] = await db
    .insert(webauthnConfigurations)
    .values({
      userId,
      name,
      credentialId,
      credentialPublicKey,
      platformAuthenticator: platformAuthenticator ?? null,
      transports: transports ?? null,
      authenticatorDataFlags: authenticatorDataFlags ?? null,
      aaguid: aaguid ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return config;
}

/**
 * Gets all WebAuthn configurations for a user.
 */
export async function getUserWebauthnConfigurations(
  userId: number
): Promise<WebauthnConfiguration[]> {
  return db.query.webauthnConfigurations.findMany({
    where: eq(webauthnConfigurations.userId, userId),
  });
}

/**
 * Finds a WebAuthn configuration by credential ID.
 */
export async function findByCredentialId(
  credentialId: string
): Promise<WebauthnConfiguration | null> {
  const config = await db.query.webauthnConfigurations.findFirst({
    where: eq(webauthnConfigurations.credentialId, credentialId),
  });
  return config ?? null;
}

/**
 * Gets a WebAuthn configuration by ID.
 */
export async function getWebauthnConfiguration(
  id: number
): Promise<WebauthnConfiguration | null> {
  const config = await db.query.webauthnConfigurations.findFirst({
    where: eq(webauthnConfigurations.id, id),
  });
  return config ?? null;
}

/**
 * Deletes a WebAuthn configuration.
 */
export async function deleteWebauthnConfiguration(
  userId: number,
  configId: number
): Promise<boolean> {
  const result = await db
    .delete(webauthnConfigurations)
    .where(
      and(
        eq(webauthnConfigurations.id, configId),
        eq(webauthnConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Renames a WebAuthn configuration.
 */
export async function renameWebauthnConfiguration(
  userId: number,
  configId: number,
  newName: string
): Promise<boolean> {
  const result = await db
    .update(webauthnConfigurations)
    .set({
      name: newName,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(webauthnConfigurations.id, configId),
        eq(webauthnConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Gets platform authenticators (passkeys) for a user.
 */
export async function getUserPasskeys(
  userId: number
): Promise<WebauthnConfiguration[]> {
  const configs = await getUserWebauthnConfigurations(userId);
  return configs.filter((c) => c.platformAuthenticator === true);
}

/**
 * Gets security keys (non-platform authenticators) for a user.
 */
export async function getUserSecurityKeys(
  userId: number
): Promise<WebauthnConfiguration[]> {
  const configs = await getUserWebauthnConfigurations(userId);
  return configs.filter((c) => c.platformAuthenticator !== true);
}

/**
 * Counts WebAuthn configurations for a user.
 */
export async function countWebauthnConfigurations(
  userId: number
): Promise<number> {
  const configs = await getUserWebauthnConfigurations(userId);
  return configs.length;
}

/**
 * Checks if user has any WebAuthn credentials.
 */
export async function hasWebauthnCredentials(userId: number): Promise<boolean> {
  const count = await countWebauthnConfigurations(userId);
  return count > 0;
}

/**
 * Checks if user has a platform authenticator (passkey).
 */
export async function hasPlatformAuthenticator(
  userId: number
): Promise<boolean> {
  const passkeys = await getUserPasskeys(userId);
  return passkeys.length > 0;
}
