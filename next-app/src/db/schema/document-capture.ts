import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Document capture sessions table
 * Tracks async document verification sessions
 */
export const documentCaptureSessions = pgTable(
  'document_capture_sessions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    uuid: varchar('uuid'),
    resultId: varchar('result_id'),
    userId: bigint('user_id', { mode: 'number' }).references(() => users.id),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    requestedAt: timestamp('requested_at'),
    issuer: varchar('issuer'),
    cancelledAt: timestamp('cancelled_at'),
    ocrConfirmationPending: boolean('ocr_confirmation_pending').default(false),
    lastDocAuthResult: varchar('last_doc_auth_result'),
    socureDocvTransactionToken: varchar('socure_docv_transaction_token'),
    socureDocvCaptureAppUrl: varchar('socure_docv_capture_app_url'),
    docAuthVendor: varchar('doc_auth_vendor'),
    passportStatus: varchar('passport_status'),
    hybridMobileThreatmetrixSessionId: varchar('hybrid_mobile_threatmetrix_session_id'),
    hybridMobileRequestIp: varchar('hybrid_mobile_request_ip'),
    // Stripe Identity verification fields
    stripeVerificationSessionId: varchar('stripe_verification_session_id'),
    stripeLastEventId: varchar('stripe_last_event_id'),
  },
  (table) => [
    index('index_document_capture_sessions_on_result_id').on(table.resultId),
    uniqueIndex('index_socure_docv_transaction_token').on(table.socureDocvTransactionToken),
    uniqueIndex('idx_doc_capture_sessions_on_stripe_session_id').on(table.stripeVerificationSessionId),
    index('idx_doc_capture_sessions_on_stripe_event_id').on(table.stripeLastEventId),
    index('index_document_capture_sessions_on_user_id').on(table.userId),
    index('index_document_capture_sessions_on_uuid').on(table.uuid),
  ]
);

export const documentCaptureSessionsRelations = relations(documentCaptureSessions, ({ one }) => ({
  user: one(users, {
    fields: [documentCaptureSessions.userId],
    references: [users.id],
  }),
}));

/**
 * Doc auth vendors enum
 */
export const DocAuthVendor = {
  LEXIS_NEXIS: 'lexis_nexis',
  SOCURE: 'socure',
  STRIPE: 'stripe',
  MOCK: 'mock',
} as const;

/**
 * Device profiling results table
 * Tracks ThreatMetrix device profiling results
 */
export const deviceProfilingResults = pgTable(
  'device_profiling_results',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    client: varchar('client'),
    reviewStatus: varchar('review_status'),
    transactionId: varchar('transaction_id'),
    processedAt: timestamp('processed_at'),
    profilingType: varchar('profiling_type'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    notes: varchar('notes'),
  },
  (table) => [index('index_device_profiling_results_on_user_id').on(table.userId)]
);

/**
 * Review status enum for device profiling
 */
export const ReviewStatus = {
  PASS: 'pass',
  REVIEW: 'review',
  REJECT: 'reject',
} as const;

/**
 * Socure reason codes table
 * Reference table for Socure DocV reason codes
 */
export const socureReasonCodes = pgTable(
  'socure_reason_codes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    code: varchar('code'),
    group: varchar('group'),
    description: varchar('description'),
    addedAt: timestamp('added_at'),
    deactivatedAt: timestamp('deactivated_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_socure_reason_codes_on_code').on(table.code),
    index('index_socure_reason_codes_on_deactivated_at').on(table.deactivatedAt),
  ]
);

export type DocumentCaptureSession = typeof documentCaptureSessions.$inferSelect;
export type NewDocumentCaptureSession = typeof documentCaptureSessions.$inferInsert;
