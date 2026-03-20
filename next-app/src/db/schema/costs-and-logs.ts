import {
  pgTable,
  serial,
  bigserial,
  integer,
  bigint,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { profiles } from './profiles';

/**
 * SP costs table - Billing tracking
 */
export const spCosts = pgTable(
  'sp_costs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    issuer: varchar('issuer').notNull(),
    agencyId: integer('agency_id').notNull(),
    costType: varchar('cost_type').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ial: integer('ial'),
    transactionId: varchar('transaction_id'),
  },
  (table) => [index('index_sp_costs_on_created_at').on(table.createdAt)]
);

/**
 * Cost types enum
 */
export const CostType = {
  AUTHENTICATION: 'authentication',
  DIGEST: 'digest',
  SMS: 'sms',
  VOICE: 'voice',
  GPO_LETTER: 'gpo_letter',
  LEXIS_NEXIS_RESOLUTION: 'lexis_nexis_resolution',
  LEXIS_NEXIS_ADDRESS: 'lexis_nexis_address',
  AAMVA: 'aamva',
  THREATMETRIX: 'threatmetrix',
  ACUANT_FRONT_IMAGE: 'acuant_front_image',
  ACUANT_BACK_IMAGE: 'acuant_back_image',
  ACUANT_SELFIE: 'acuant_selfie',
  ACUANT_RESULT: 'acuant_result',
} as const;

/**
 * SP return logs table - Tracks returns to service providers
 */
export const spReturnLogs = pgTable(
  'sp_return_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    requestId: varchar('request_id').notNull(),
    ial: integer('ial').notNull(),
    issuer: varchar('issuer').notNull(),
    userId: integer('user_id'),
    returnedAt: timestamp('returned_at'),
    billable: boolean('billable'),
    profileId: bigint('profile_id', { mode: 'number' }),
    profileVerifiedAt: timestamp('profile_verified_at'),
    profileRequestedIssuer: varchar('profile_requested_issuer'),
  },
  (table) => [
    // Partial index for billing queries
    index('index_sp_return_logs_on_returned_at_date_issuer')
      .on(sql`(returned_at::date)`, table.issuer)
      .where(sql`billable = true AND returned_at IS NOT NULL`),
    uniqueIndex('index_sp_return_logs_on_request_id').on(table.requestId),
  ]
);

/**
 * Registration logs table
 */
export const registrationLogs = pgTable(
  'registration_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    registeredAt: timestamp('registered_at'),
  },
  (table) => [
    index('index_registration_logs_on_registered_at').on(table.registeredAt),
    uniqueIndex('index_registration_logs_on_user_id').on(table.userId),
  ]
);

export const registrationLogsRelations = relations(registrationLogs, ({ one }) => ({
  user: one(users, {
    fields: [registrationLogs.userId],
    references: [users.id],
  }),
}));

/**
 * Doc auth logs table - Tracks document authentication flow progress
 */
export const docAuthLogs = pgTable(
  'doc_auth_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    welcomeViewAt: timestamp('welcome_view_at'),
    welcomeViewCount: integer('welcome_view_count').default(0),
    uploadViewAt: timestamp('upload_view_at'),
    uploadViewCount: integer('upload_view_count').default(0),
    linkSentViewAt: timestamp('link_sent_view_at'),
    linkSentViewCount: integer('link_sent_view_count').default(0),
    frontImageViewAt: timestamp('front_image_view_at'),
    frontImageViewCount: integer('front_image_view_count').default(0),
    frontImageSubmitCount: integer('front_image_submit_count').default(0),
    frontImageErrorCount: integer('front_image_error_count').default(0),
    backImageViewAt: timestamp('back_image_view_at'),
    backImageViewCount: integer('back_image_view_count').default(0),
    backImageSubmitCount: integer('back_image_submit_count').default(0),
    backImageErrorCount: integer('back_image_error_count').default(0),
    ssnViewAt: timestamp('ssn_view_at'),
    ssnViewCount: integer('ssn_view_count').default(0),
    verifyViewAt: timestamp('verify_view_at'),
    verifyViewCount: integer('verify_view_count').default(0),
    verifySubmitCount: integer('verify_submit_count').default(0),
    verifyErrorCount: integer('verify_error_count').default(0),
    verifyPhoneViewAt: timestamp('verify_phone_view_at'),
    verifyPhoneViewCount: integer('verify_phone_view_count').default(0),
    verifiedViewAt: timestamp('verified_view_at'),
    verifiedViewCount: integer('verified_view_count').default(0),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    issuer: varchar('issuer'),
    lastDocumentError: varchar('last_document_error'),
    documentCaptureViewAt: timestamp('document_capture_view_at'),
    documentCaptureViewCount: integer('document_capture_view_count').default(0),
    documentCaptureSubmitCount: integer('document_capture_submit_count').default(0),
    documentCaptureErrorCount: integer('document_capture_error_count').default(0),
    agreementViewAt: timestamp('agreement_view_at'),
    agreementViewCount: integer('agreement_view_count').default(0),
    state: varchar('state'),
    verifySubmitAt: timestamp('verify_submit_at'),
    verifyPhoneSubmitCount: integer('verify_phone_submit_count').default(0),
    verifyPhoneSubmitAt: timestamp('verify_phone_submit_at'),
    documentCaptureSubmitAt: timestamp('document_capture_submit_at'),
    backImageSubmitAt: timestamp('back_image_submit_at'),
    // Additional mobile and capture fields omitted for brevity
  },
  (table) => [
    index('index_doc_auth_logs_on_issuer').on(table.issuer),
    uniqueIndex('index_doc_auth_logs_on_user_id').on(table.userId),
    index('index_doc_auth_logs_on_verified_view_at').on(table.verifiedViewAt),
  ]
);

export const docAuthLogsRelations = relations(docAuthLogs, ({ one }) => ({
  user: one(users, {
    fields: [docAuthLogs.userId],
    references: [users.id],
  }),
}));

/**
 * GPO confirmation codes table
 * Tracks verification codes sent via USPS mail
 *
 * Sensitive fields:
 * - otp_fingerprint
 */
export const gpoConfirmationCodes = pgTable(
  'usps_confirmation_codes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id),
    // Sensitive: Fingerprint of OTP code
    otpFingerprint: varchar('otp_fingerprint').notNull(),
    codeSentAt: timestamp('code_sent_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    reminderSentAt: timestamp('reminder_sent_at'),
  },
  (table) => [
    index('index_usps_confirmation_codes_on_otp_fingerprint').on(table.otpFingerprint),
    index('index_usps_confirmation_codes_on_profile_id').on(table.profileId),
    index('index_usps_confirmation_codes_on_reminder_sent_at').on(table.reminderSentAt),
  ]
);

export const gpoConfirmationCodesRelations = relations(gpoConfirmationCodes, ({ one }) => ({
  profile: one(profiles, {
    fields: [gpoConfirmationCodes.profileId],
    references: [profiles.id],
  }),
}));

/**
 * GPO confirmations table (batch exports)
 */
export const gpoConfirmations = pgTable('usps_confirmations', {
  id: serial('id').primaryKey(),
  entry: text('entry').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  entryMultiRegion: text('entry_multi_region'),
});

/**
 * Letter requests to GPO FTP log
 */
export const letterRequestsToGpoFtpLogs = pgTable(
  'letter_requests_to_usps_ftp_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    ftpAt: timestamp('ftp_at').notNull(),
    letterRequestsCount: integer('letter_requests_count').notNull(),
  },
  (table) => [index('index_letter_requests_to_usps_ftp_logs_on_ftp_at').on(table.ftpAt)]
);

/**
 * AB test assignments table
 */
export const abTestAssignments = pgTable(
  'ab_test_assignments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    experiment: varchar('experiment').notNull(),
    discriminator: varchar('discriminator').notNull(),
    bucket: varchar('bucket').notNull(),
  },
  (table) => [
    uniqueIndex('index_ab_test_assignments_on_experiment_and_discriminator').on(
      table.experiment,
      table.discriminator
    ),
  ]
);

/**
 * Recaptcha assessments table
 */
export const recaptchaAssessments = pgTable('recaptcha_assessments', {
  id: varchar('id').primaryKey(),
  annotation: varchar('annotation'),
  annotationReason: varchar('annotation_reason'),
});

/**
 * User proofing events table
 *
 * Sensitive fields:
 * - encrypted_events
 * - cost
 * - salt
 */
export const userProofingEvents = pgTable(
  'user_proofing_events',
  {
    id: serial('id').primaryKey(),
    // Sensitive: Encrypted proofing events
    encryptedEvents: varchar('encrypted_events').notNull(),
    profileId: bigint('profile_id', { mode: 'number' })
      .notNull()
      .references(() => profiles.id),
    serviceProvidersSent: jsonb('service_providers_sent').default([]).notNull(),
    // Sensitive
    cost: varchar('cost').notNull(),
    // Sensitive
    salt: varchar('salt').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('index_user_proofing_events_on_profile_id').on(table.profileId)]
);

/**
 * SP upgraded biometric profiles table
 */
export const spUpgradedBiometricProfiles = pgTable(
  'sp_upgraded_biometric_profiles',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    upgradedAt: timestamp('upgraded_at').notNull(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    idvLevel: varchar('idv_level').notNull(),
    issuer: varchar('issuer').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('index_sp_upgraded_biometric_profiles_on_issuer_and_upgraded_at').on(
      table.issuer,
      table.upgradedAt
    ),
    index('index_sp_upgraded_biometric_profiles_on_user_id').on(table.userId),
  ]
);

/**
 * Duplicate profile sets table
 */
export const duplicateProfileSets = pgTable(
  'duplicate_profile_sets',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    serviceProvider: varchar('service_provider', { length: 255 }).notNull(),
    profileIds: bigint('profile_ids', { mode: 'number' }).array().notNull(),
    closedAt: timestamp('closed_at'),
    selfServiced: boolean('self_serviced'),
    fraudInvestigationConclusive: boolean('fraud_investigation_conclusive'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    // GIN index for array queries
    index('index_duplicate_profile_sets_on_profile_ids').using('gin', table.profileIds),
    uniqueIndex('idx_on_service_provider_profile_ids_7f75d24ae3').on(
      table.serviceProvider,
      table.profileIds
    ),
  ]
);

export type SpCost = typeof spCosts.$inferSelect;
export type NewSpCost = typeof spCosts.$inferInsert;
export type DocAuthLog = typeof docAuthLogs.$inferSelect;
export type NewDocAuthLog = typeof docAuthLogs.$inferInsert;
