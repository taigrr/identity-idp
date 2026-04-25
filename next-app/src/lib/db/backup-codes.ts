/**
 * Backup Code Configuration Service
 * Mirrors: app/services/backup_code_generator.rb
 *          app/models/backup_code_configuration.rb
 *
 * Provides backup code generation, storage, and validation.
 */

import { eq, and, isNull, sql } from 'drizzle-orm';
import { db, backupCodeConfigurations, type BackupCodeConfiguration } from '@/db';
import { randomBytes, createHash, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const NUMBER_OF_CODES = 10;
const NUM_WORDS = 3;
const WORD_LIST_SIZE = 256; // Simplified - use a word list
const CODE_COST = '10$8$1$'; // SCrypt cost parameters

// Simplified word generation (in production, use a proper word list)
function generateWord(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let word = '';
  for (let i = 0; i < 4; i++) {
    word += chars[Math.floor(Math.random() * chars.length)];
  }
  return word;
}

/**
 * Generates a random backup code (e.g., "word1word2word3")
 */
export function generateBackupCode(): string {
  const words: string[] = [];
  for (let i = 0; i < NUM_WORDS; i++) {
    words.push(generateWord());
  }
  return words.join('');
}

/**
 * Normalizes a backup code for comparison.
 */
export function normalizeBackupCode(code: string): string {
  return code.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
}

/**
 * Generates a salted fingerprint for a backup code.
 * Uses SCrypt like the Ruby implementation.
 */
async function generateSaltedFingerprint(
  code: string,
  salt: string,
  cost: string
): Promise<string> {
  const normalizedCode = normalizeBackupCode(code);
  
  // Parse cost parameters (format: "10$8$1$" for N=2^10, r=8, p=1)
  const [nLog2, r, p] = cost.replace(/\$$/, '').split('$').map(Number);
  const N = Math.pow(2, nLog2);
  
  // Create the salt hash as the Ruby implementation does
  const saltHash = createHash('sha256').update(salt).digest('hex');
  
  // Generate SCrypt hash
  const derivedKey = (await scryptAsync(normalizedCode, saltHash, 32)) as Buffer;
  
  return derivedKey.toString('hex');
}

/**
 * Deletes all existing backup codes for a user and generates new ones.
 * Mirrors: BackupCodeGenerator#delete_and_regenerate
 */
export async function deleteAndRegenerateBackupCodes(
  userId: number
): Promise<string[]> {
  const salt = randomBytes(32).toString('hex');
  const codes: string[] = [];
  const now = new Date();

  // Generate unique codes
  while (codes.length < NUMBER_OF_CODES) {
    const code = generateBackupCode();
    if (!codes.includes(code)) {
      codes.push(code);
    }
  }

  // Transaction: delete old codes and insert new ones
  await db.transaction(async (tx) => {
    // Delete all existing codes for user
    await tx
      .delete(backupCodeConfigurations)
      .where(eq(backupCodeConfigurations.userId, userId));

    // Insert new codes
    for (const code of codes) {
      const fingerprint = await generateSaltedFingerprint(code, salt, CODE_COST);
      
      await tx.insert(backupCodeConfigurations).values({
        userId,
        codeSalt: salt,
        codeCost: CODE_COST,
        saltedCodeFingerprint: fingerprint,
        usedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  return codes;
}

/**
 * Validates and consumes a backup code.
 * Returns the configuration creation date if valid, null otherwise.
 * Mirrors: BackupCodeGenerator#if_valid_consume_code_return_config_created_at
 */
export async function validateAndConsumeBackupCode(
  userId: number,
  plaintextCode: string
): Promise<Date | null> {
  if (!plaintextCode) {
    return null;
  }

  const normalizedCode = normalizeBackupCode(plaintextCode);
  if (!normalizedCode) {
    return null;
  }

  // Get all distinct salt/cost combinations for this user
  const saltCosts = await db
    .selectDistinct({
      codeSalt: backupCodeConfigurations.codeSalt,
      codeCost: backupCodeConfigurations.codeCost,
    })
    .from(backupCodeConfigurations)
    .where(
      and(
        eq(backupCodeConfigurations.userId, userId),
        sql`${backupCodeConfigurations.codeSalt} IS NOT NULL`,
        sql`${backupCodeConfigurations.codeCost} IS NOT NULL`
      )
    );

  // Generate fingerprints for all salt/cost combinations
  const fingerprints: string[] = [];
  for (const { codeSalt, codeCost } of saltCosts) {
    if (codeSalt && codeCost) {
      const fingerprint = await generateSaltedFingerprint(
        normalizedCode,
        codeSalt,
        codeCost
      );
      fingerprints.push(fingerprint);
    }
  }

  if (fingerprints.length === 0) {
    return null;
  }

  // Find and consume the matching code in a single atomic operation
  const result = await db
    .update(backupCodeConfigurations)
    .set({
      usedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(backupCodeConfigurations.userId, userId),
        sql`${backupCodeConfigurations.saltedCodeFingerprint} IN (${sql.join(
          fingerprints.map((f) => sql`${f}`),
          sql`, `
        )})`,
        isNull(backupCodeConfigurations.usedAt)
      )
    )
    .returning({ createdAt: backupCodeConfigurations.createdAt });

  if (result.length > 0) {
    return result[0].createdAt;
  }

  return null;
}

/**
 * Gets all backup codes for a user (unused only).
 */
export async function getUnusedBackupCodes(
  userId: number
): Promise<BackupCodeConfiguration[]> {
  return db.query.backupCodeConfigurations.findMany({
    where: and(
      eq(backupCodeConfigurations.userId, userId),
      isNull(backupCodeConfigurations.usedAt)
    ),
  });
}

/**
 * Counts unused backup codes for a user.
 */
export async function countUnusedBackupCodes(userId: number): Promise<number> {
  const codes = await getUnusedBackupCodes(userId);
  return codes.length;
}

/**
 * Checks if user has any backup codes configured.
 */
export async function hasBackupCodes(userId: number): Promise<boolean> {
  const count = await countUnusedBackupCodes(userId);
  return count > 0;
}

/**
 * Finds a backup code configuration by code (without consuming it).
 * Useful for validation during setup.
 */
export async function findBackupCodeConfig(
  userId: number,
  code: string
): Promise<BackupCodeConfiguration | null> {
  const normalizedCode = normalizeBackupCode(code);
  if (!normalizedCode) {
    return null;
  }

  const configs = await db.query.backupCodeConfigurations.findMany({
    where: eq(backupCodeConfigurations.userId, userId),
  });

  for (const config of configs) {
    if (config.codeSalt && config.codeCost) {
      const fingerprint = await generateSaltedFingerprint(
        normalizedCode,
        config.codeSalt,
        config.codeCost
      );
      if (fingerprint === config.saltedCodeFingerprint) {
        return config;
      }
    }
  }

  return null;
}
