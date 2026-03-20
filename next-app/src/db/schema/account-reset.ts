import {
  pgTable,
  bigserial,
  integer,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Account reset requests table
 * Tracks requests to reset accounts when user has lost all MFA methods
 *
 * Sensitive fields:
 * - request_token
 * - granted_token
 */
export const accountResetRequests = pgTable(
  'account_reset_requests',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at'),
    // Sensitive: Token for initiating reset
    requestToken: varchar('request_token'),
    cancelledAt: timestamp('cancelled_at'),
    grantedAt: timestamp('granted_at'),
    // Sensitive: Token for completing reset after waiting period
    grantedToken: varchar('granted_token'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    requestingIssuer: varchar('requesting_issuer'),
  },
  (table) => [
    index('index_account_reset_requests_on_timestamps').on(
      table.cancelledAt,
      table.grantedAt,
      table.requestedAt
    ),
    uniqueIndex('index_account_reset_requests_on_granted_token').on(table.grantedToken),
    uniqueIndex('index_account_reset_requests_on_request_token').on(table.requestToken),
    uniqueIndex('index_account_reset_requests_on_user_id').on(table.userId),
  ]
);

export const accountResetRequestsRelations = relations(accountResetRequests, ({ one }) => ({
  user: one(users, {
    fields: [accountResetRequests.userId],
    references: [users.id],
  }),
}));

/**
 * Deleted users table
 * Tracks users who have deleted their accounts
 */
export const deletedUsers = pgTable(
  'deleted_users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id').notNull(),
    uuid: varchar('uuid').notNull(),
    userCreatedAt: timestamp('user_created_at').notNull(),
    deletedAt: timestamp('deleted_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_deleted_users_on_user_id').on(table.userId),
    uniqueIndex('index_deleted_users_on_uuid').on(table.uuid),
  ]
);

/**
 * Fraud review requests table
 */
export const fraudReviewRequests = pgTable(
  'fraud_review_requests',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id'),
    uuid: varchar('uuid'),
    irsSessionId: varchar('irs_session_id'),
    loginSessionId: varchar('login_session_id'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('index_fraud_review_requests_on_user_id').on(table.userId)]
);

export type AccountResetRequest = typeof accountResetRequests.$inferSelect;
export type NewAccountResetRequest = typeof accountResetRequests.$inferInsert;
