import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { profiles } from './profiles';
import { serviceProviders } from './service-providers';

/**
 * In-person enrollments table
 * Tracks USPS in-person identity proofing enrollments
 *
 * Complex state machine with status tracking
 *
 * Sensitive fields:
 * - selected_location_details (contains address)
 */
export const inPersonEnrollments = pgTable(
  'in_person_enrollments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    profileId: bigint('profile_id', { mode: 'number' }).references(() => profiles.id),
    enrollmentCode: varchar('enrollment_code'),
    statusCheckAttemptedAt: timestamp('status_check_attempted_at'),
    statusUpdatedAt: timestamp('status_updated_at'),
    status: integer('status').default(0),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    currentAddressMatchesId: boolean('current_address_matches_id'),
    // Sensitive: Contains address and location details
    selectedLocationDetails: jsonb('selected_location_details'),
    uniqueId: varchar('unique_id'),
    enrollmentEstablishedAt: timestamp('enrollment_established_at'),
    issuer: varchar('issuer'),
    followUpSurveySent: boolean('follow_up_survey_sent').default(false),
    earlyReminderSent: boolean('early_reminder_sent').default(false),
    lateReminderSent: boolean('late_reminder_sent').default(false),
    deadlinePassedSent: boolean('deadline_passed_sent').default(false),
    proofedAt: timestamp('proofed_at'),
    captureSecondaryIdEnabled: boolean('capture_secondary_id_enabled').default(false),
    statusCheckCompletedAt: timestamp('status_check_completed_at'),
    readyForStatusCheck: boolean('ready_for_status_check').default(false),
    notificationSentAt: timestamp('notification_sent_at'),
    lastBatchClaimedAt: timestamp('last_batch_claimed_at'),
    sponsorId: varchar('sponsor_id').notNull(),
    docAuthResult: varchar('doc_auth_result'),
    documentType: integer('document_type'),
  },
  (table) => [
    index('index_in_person_enrollments_on_profile_id').on(table.profileId),
    index('index_in_person_enrollments_on_ready_for_status_check')
      .on(table.readyForStatusCheck)
      .where(sql`ready_for_status_check = true`),
    index('index_in_person_enrollments_on_status_check_attempted_at')
      .on(table.statusCheckAttemptedAt)
      .where(sql`status = 1`),
    uniqueIndex('index_in_person_enrollments_on_unique_id').on(table.uniqueId),
    uniqueIndex('index_in_person_enrollments_on_user_id_and_status')
      .on(table.userId, table.status)
      .where(sql`status = 1`),
    index('index_in_person_enrollments_on_user_id').on(table.userId),
  ]
);

export const inPersonEnrollmentsRelations = relations(inPersonEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [inPersonEnrollments.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [inPersonEnrollments.profileId],
    references: [profiles.id],
  }),
  serviceProvider: one(serviceProviders, {
    fields: [inPersonEnrollments.issuer],
    references: [serviceProviders.issuer],
  }),
  notificationPhoneConfiguration: one(notificationPhoneConfigurations),
}));

/**
 * Enrollment status enum
 */
export const EnrollmentStatus = {
  PENDING: 0,
  ESTABLISHING: 1,
  ESTABLISHED: 2,
  PASSED: 3,
  FAILED: 4,
  EXPIRED: 5,
  CANCELLED: 6,
} as const;

/**
 * Document type enum
 */
export const DocumentType = {
  STATE_ID: 0,
  PASSPORT: 1,
} as const;

/**
 * Notification phone configurations
 * Stores phone numbers for in-person enrollment notifications
 *
 * Sensitive fields:
 * - encrypted_phone
 */
export const notificationPhoneConfigurations = pgTable(
  'notification_phone_configurations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    inPersonEnrollmentId: bigint('in_person_enrollment_id', { mode: 'number' })
      .notNull()
      .references(() => inPersonEnrollments.id),
    // Sensitive: Encrypted phone number
    encryptedPhone: text('encrypted_phone').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_notification_phone_configurations_on_enrollment_id').on(
      table.inPersonEnrollmentId
    ),
  ]
);

export type InPersonEnrollment = typeof inPersonEnrollments.$inferSelect;
export type NewInPersonEnrollment = typeof inPersonEnrollments.$inferInsert;
