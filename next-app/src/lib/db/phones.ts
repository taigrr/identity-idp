/**
 * Phone Configuration Service
 * Mirrors: app/services/update_user_phone_configuration.rb
 *
 * Handles phone configuration management for MFA.
 */

import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  phoneConfigurations,
  phoneNumberOptOuts,
  type PhoneConfiguration,
} from '@/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { createHash, randomUUID } from 'crypto';

export const DeliveryPreference = {
  SMS: 0,
  VOICE: 1,
} as const;

export type DeliveryPreferenceType =
  (typeof DeliveryPreference)[keyof typeof DeliveryPreference];

/**
 * Generates a fingerprint for a phone number (for lookups without decryption).
 */
export function fingerprintPhone(phone: string): string {
  // Normalize: remove all non-digits
  const normalized = phone.replace(/\D/g, '');
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Creates or updates a phone configuration for a user.
 * Mirrors: UpdateUserPhoneConfiguration
 */
export async function createOrUpdatePhoneConfiguration(
  userId: number,
  phone: string,
  deliveryPreference: DeliveryPreferenceType = DeliveryPreference.SMS
): Promise<PhoneConfiguration> {
  const now = new Date();
  const encryptedPhone = await encrypt(phone);

  // Check for existing unconfirmed phone for this user
  const existing = await db.query.phoneConfigurations.findFirst({
    where: and(
      eq(phoneConfigurations.userId, userId),
      sql`${phoneConfigurations.confirmedAt} IS NULL`
    ),
  });

  if (existing) {
    // Update existing unconfirmed phone
    const [updated] = await db
      .update(phoneConfigurations)
      .set({
        encryptedPhone,
        deliveryPreference,
        updatedAt: now,
      })
      .where(eq(phoneConfigurations.id, existing.id))
      .returning();
    return updated;
  }

  // Create new phone configuration
  const [created] = await db
    .insert(phoneConfigurations)
    .values({
      userId,
      encryptedPhone,
      deliveryPreference,
      mfaEnabled: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

/**
 * Confirms a phone configuration.
 */
export async function confirmPhoneConfiguration(
  userId: number,
  phoneId: number
): Promise<PhoneConfiguration | null> {
  const now = new Date();

  const [updated] = await db
    .update(phoneConfigurations)
    .set({
      confirmedAt: now,
      madeDefaultAt: now, // First confirmed phone becomes default
      updatedAt: now,
    })
    .where(
      and(
        eq(phoneConfigurations.id, phoneId),
        eq(phoneConfigurations.userId, userId)
      )
    )
    .returning();

  return updated ?? null;
}

/**
 * Gets all phone configurations for a user.
 */
export async function getUserPhoneConfigurations(
  userId: number
): Promise<PhoneConfiguration[]> {
  return db.query.phoneConfigurations.findMany({
    where: eq(phoneConfigurations.userId, userId),
  });
}

/**
 * Gets confirmed phone configurations for a user.
 */
export async function getUserConfirmedPhones(
  userId: number
): Promise<PhoneConfiguration[]> {
  return db.query.phoneConfigurations.findMany({
    where: and(
      eq(phoneConfigurations.userId, userId),
      sql`${phoneConfigurations.confirmedAt} IS NOT NULL`
    ),
  });
}

/**
 * Gets the default phone configuration for a user.
 */
export async function getDefaultPhone(
  userId: number
): Promise<PhoneConfiguration | null> {
  const phones = await getUserConfirmedPhones(userId);

  if (phones.length === 0) return null;

  // Sort by madeDefaultAt desc, then createdAt desc
  phones.sort((a, b) => {
    if (a.madeDefaultAt && b.madeDefaultAt) {
      return b.madeDefaultAt.getTime() - a.madeDefaultAt.getTime();
    }
    if (a.madeDefaultAt) return -1;
    if (b.madeDefaultAt) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return phones[0];
}

/**
 * Deletes a phone configuration.
 */
export async function deletePhoneConfiguration(
  userId: number,
  phoneId: number
): Promise<boolean> {
  const result = await db
    .delete(phoneConfigurations)
    .where(
      and(
        eq(phoneConfigurations.id, phoneId),
        eq(phoneConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Sets a phone as the default for a user.
 */
export async function setDefaultPhone(
  userId: number,
  phoneId: number
): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(phoneConfigurations)
    .set({
      madeDefaultAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(phoneConfigurations.id, phoneId),
        eq(phoneConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Updates delivery preference for a phone.
 */
export async function updateDeliveryPreference(
  userId: number,
  phoneId: number,
  deliveryPreference: DeliveryPreferenceType
): Promise<boolean> {
  const result = await db
    .update(phoneConfigurations)
    .set({
      deliveryPreference,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(phoneConfigurations.id, phoneId),
        eq(phoneConfigurations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Checks if a phone number has opted out of SMS.
 */
export async function isPhoneOptedOut(phone: string): Promise<boolean> {
  const fingerprint = fingerprintPhone(phone);

  const optOut = await db.query.phoneNumberOptOuts.findFirst({
    where: eq(phoneNumberOptOuts.phoneFingerprint, fingerprint),
  });

  return optOut !== undefined;
}

/**
 * Records a phone opt-out.
 */
export async function optOutPhone(phone: string): Promise<string> {
  const now = new Date();
  const fingerprint = fingerprintPhone(phone);
  const encryptedPhone = await encrypt(phone);
  const uuid = randomUUID();

  await db.insert(phoneNumberOptOuts).values({
    encryptedPhone,
    phoneFingerprint: fingerprint,
    uuid,
    createdAt: now,
    updatedAt: now,
  });

  return uuid;
}

/**
 * Removes a phone opt-out.
 */
export async function optInPhone(uuid: string): Promise<boolean> {
  const result = await db
    .delete(phoneNumberOptOuts)
    .where(eq(phoneNumberOptOuts.uuid, uuid))
    .returning();

  return result.length > 0;
}

/**
 * Counts confirmed phones for a user.
 */
export async function countConfirmedPhones(userId: number): Promise<number> {
  const phones = await getUserConfirmedPhones(userId);
  return phones.length;
}
