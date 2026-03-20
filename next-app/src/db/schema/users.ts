import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table - Core identity
 *
 * Sensitive fields (encrypted):
 * - reset_password_token
 * - direct_otp
 * - encrypted_password_digest
 * - encrypted_recovery_code_digest
 * - encrypted_password_digest_multi_region
 * - encrypted_recovery_code_digest_multi_region
 */
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    resetPasswordToken: varchar('reset_password_token', { length: 255 }),
    resetPasswordSentAt: timestamp('reset_password_sent_at'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    confirmedAt: timestamp('confirmed_at'),
    secondFactorAttemptsCount: integer('second_factor_attempts_count').default(0),
    uuid: varchar('uuid', { length: 255 }).notNull(),
    secondFactorLockedAt: timestamp('second_factor_locked_at'),
    // Sensitive: OTP for 2FA
    directOtp: varchar('direct_otp'),
    directOtpSentAt: timestamp('direct_otp_sent_at'),
    uniqueSessionId: varchar('unique_session_id'),
    otpDeliveryPreference: integer('otp_delivery_preference').default(0).notNull(),
    // Sensitive: Encrypted password (KMS)
    encryptedPasswordDigest: varchar('encrypted_password_digest').default(''),
    // Sensitive: Encrypted recovery code (KMS)
    encryptedRecoveryCodeDigest: varchar('encrypted_recovery_code_digest').default(''),
    rememberDeviceRevokedAt: timestamp('remember_device_revoked_at'),
    emailLanguage: varchar('email_language', { length: 10 }),
    acceptedTermsAt: timestamp('accepted_terms_at'),
    encryptedRecoveryCodeDigestGeneratedAt: timestamp('encrypted_recovery_code_digest_generated_at'),
    suspendedAt: timestamp('suspended_at'),
    reinstatedAt: timestamp('reinstated_at'),
    // Multi-region encrypted fields for disaster recovery
    encryptedPasswordDigestMultiRegion: varchar('encrypted_password_digest_multi_region'),
    encryptedRecoveryCodeDigestMultiRegion: varchar('encrypted_recovery_code_digest_multi_region'),
    secondMfaReminderDismissedAt: timestamp('second_mfa_reminder_dismissed_at'),
    pivCacRecommendedDismissedAt: timestamp('piv_cac_recommended_dismissed_at'),
    signInNewDeviceAt: timestamp('sign_in_new_device_at'),
    passwordCompromisedCheckedAt: timestamp('password_compromised_checked_at'),
    webauthnPlatformRecommendedDismissedAt: timestamp('webauthn_platform_recommended_dismissed_at'),
  },
  (table) => [
    uniqueIndex('index_users_on_reset_password_token').on(table.resetPasswordToken),
    index('index_users_on_sign_in_new_device_at').on(table.signInNewDeviceAt),
    uniqueIndex('index_users_on_uuid').on(table.uuid),
  ]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  emailAddresses: many(emailAddresses),
  phoneConfigurations: many(phoneConfigurations),
  profiles: many(profiles),
  devices: many(devices),
  identities: many(identities),
  authAppConfigurations: many(authAppConfigurations),
  webauthnConfigurations: many(webauthnConfigurations),
  pivCacConfigurations: many(pivCacConfigurations),
  backupCodeConfigurations: many(backupCodeConfigurations),
  events: many(events),
  securityEvents: many(securityEvents),
  accountResetRequest: one(accountResetRequests),
  registrationLog: one(registrationLogs),
  docAuthLog: one(docAuthLogs),
}));

// Forward declarations for relations (defined in other files)
import { emailAddresses } from './email-addresses';
import { phoneConfigurations } from './phone-configurations';
import { profiles } from './profiles';
import { devices } from './devices';
import { identities } from './identities';
import {
  authAppConfigurations,
  webauthnConfigurations,
  pivCacConfigurations,
  backupCodeConfigurations,
} from './mfa-configurations';
import { events, securityEvents } from './security-events';
import { accountResetRequests } from './account-reset';
import { registrationLogs, docAuthLogs } from './costs-and-logs';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
