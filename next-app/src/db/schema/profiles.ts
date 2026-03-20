import {
  pgTable,
  serial,
  integer,
  boolean,
  timestamp,
  text,
  varchar,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Profiles table - Identity verification results
 *
 * Contains encrypted PII (Personally Identifiable Information)
 * Multi-region encryption for disaster recovery
 *
 * Sensitive fields:
 * - encrypted_pii (full PII blob)
 * - encrypted_pii_recovery (recovery key encrypted PII)
 * - ssn_signature (hashed SSN for dedup)
 * - name_zip_birth_year_signature (hashed for dedup)
 */
export const profiles = pgTable(
  'profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    active: boolean('active').default(false).notNull(),
    verifiedAt: timestamp('verified_at'),
    activatedAt: timestamp('activated_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    // Sensitive: Full encrypted PII (name, address, DOB, etc.)
    encryptedPii: text('encrypted_pii'),
    // Sensitive: Hashed SSN for duplicate detection
    ssnSignature: varchar('ssn_signature', { length: 64 }),
    // Sensitive: Recovery-key encrypted PII
    encryptedPiiRecovery: text('encrypted_pii_recovery'),
    deactivationReason: integer('deactivation_reason'),
    proofingComponents: jsonb('proofing_components'),
    // Sensitive: Name+ZIP+birth year hash for duplicate detection
    nameZipBirthYearSignature: varchar('name_zip_birth_year_signature'),
    initiatingServiceProviderIssuer: varchar('initiating_service_provider_issuer'),
    fraudReviewPendingAt: timestamp('fraud_review_pending_at'),
    fraudRejectionAt: timestamp('fraud_rejection_at'),
    gpoVerificationPendingAt: timestamp('gpo_verification_pending_at'),
    fraudPendingReason: integer('fraud_pending_reason'),
    inPersonVerificationPendingAt: timestamp('in_person_verification_pending_at'),
    // Multi-region encrypted fields for disaster recovery
    encryptedPiiMultiRegion: text('encrypted_pii_multi_region'),
    encryptedPiiRecoveryMultiRegion: text('encrypted_pii_recovery_multi_region'),
    gpoVerificationExpiredAt: timestamp('gpo_verification_expired_at'),
    idvLevel: integer('idv_level'),
  },
  (table) => [
    index('index_profiles_on_fraud_pending_reason').on(table.fraudPendingReason),
    index('index_profiles_on_fraud_rejection_at').on(table.fraudRejectionAt),
    index('index_profiles_on_fraud_review_pending_at').on(table.fraudReviewPendingAt),
    index('index_profiles_on_gpo_verification_expired_at').on(table.gpoVerificationExpiredAt),
    index('index_profiles_on_gpo_verification_pending_at').on(table.gpoVerificationPendingAt),
    index('index_profiles_on_name_zip_birth_year_signature').on(table.nameZipBirthYearSignature),
    index('index_profiles_on_ssn_signature').on(table.ssnSignature),
    uniqueIndex('index_profiles_on_user_id_and_active')
      .on(table.userId, table.active)
      .where(sql`active = true`),
    index('index_profiles_on_user_id').on(table.userId),
  ]
);

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  inPersonEnrollments: many(inPersonEnrollments),
  gpoConfirmationCodes: many(gpoConfirmationCodes),
}));

// Forward declarations
import { inPersonEnrollments } from './in-person-enrollments';
import { gpoConfirmationCodes } from './costs-and-logs';

/**
 * Deactivation reasons enum
 */
export const DeactivationReason = {
  PASSWORD_RESET: 0,
  ENCRYPTION_ERROR: 1,
  ADMIN: 2,
  VERIFICATION_CANCELLED: 3,
  GPO_VERIFICATION_EXPIRED: 4,
} as const;

/**
 * Fraud pending reasons enum
 */
export const FraudPendingReason = {
  THREATMETRIX_REVIEW: 0,
  MANUAL_REVIEW: 1,
} as const;

/**
 * IDV levels enum
 */
export const IdvLevel = {
  LEGACY_UNSUPERVISED: 0,
  LEGACY_IN_PERSON: 1,
  UNSUPERVISED_WITH_SELFIE: 2,
  IN_PERSON: 3,
} as const;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
