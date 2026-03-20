import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Email addresses table
 *
 * Sensitive fields:
 * - confirmation_token
 * - encrypted_email (KMS encrypted)
 *
 * Uses email_fingerprint for lookups without decryption
 */
export const emailAddresses = pgTable(
  'email_addresses',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' }).references(() => users.id),
    // Sensitive: Token for email confirmation
    confirmationToken: varchar('confirmation_token', { length: 255 }),
    confirmedAt: timestamp('confirmed_at'),
    confirmationSentAt: timestamp('confirmation_sent_at'),
    // Non-reversible fingerprint for lookups
    emailFingerprint: varchar('email_fingerprint').default('').notNull(),
    // Sensitive: KMS-encrypted email address
    encryptedEmail: varchar('encrypted_email').default('').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    lastSignInAt: timestamp('last_sign_in_at'),
  },
  (table) => [
    uniqueIndex('index_email_addresses_on_confirmation_token').on(table.confirmationToken),
    uniqueIndex('index_email_addresses_on_email_fingerprint_and_user_id').on(
      table.emailFingerprint,
      table.userId
    ),
    uniqueIndex('index_email_addresses_on_email_fingerprint')
      .on(table.emailFingerprint)
      .where(sql`confirmed_at IS NOT NULL`),
    index('index_email_addresses_on_user_id').on(table.userId),
  ]
);

export const emailAddressesRelations = relations(emailAddresses, ({ one }) => ({
  user: one(users, {
    fields: [emailAddresses.userId],
    references: [users.id],
  }),
}));

/**
 * Suspended emails table
 * Tracks emails that have been suspended for abuse
 */
export const suspendedEmails = pgTable(
  'suspended_emails',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    emailAddressId: bigint('email_address_id', { mode: 'number' })
      .notNull()
      .references(() => emailAddresses.id),
    digestedBaseEmail: varchar('digested_base_email').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('index_suspended_emails_on_digested_base_email').on(table.digestedBaseEmail),
    index('index_suspended_emails_on_email_address_id').on(table.emailAddressId),
  ]
);

/**
 * Disposable email domains table
 * Blocklist for disposable/temporary email providers
 */
export const disposableEmailDomains = pgTable(
  'disposable_email_domains',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    // Using citext type equivalent - handled at query level
    name: varchar('name').notNull(),
  },
  (table) => [uniqueIndex('index_disposable_email_domains_on_name').on(table.name)]
);

/**
 * Federal email domains table
 * Allowlist for .gov and .mil domains
 */
export const federalEmailDomains = pgTable(
  'federal_email_domains',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name').notNull(),
  },
  (table) => [uniqueIndex('index_federal_email_domains_on_name').on(table.name)]
);

export type EmailAddress = typeof emailAddresses.$inferSelect;
export type NewEmailAddress = typeof emailAddresses.$inferInsert;
