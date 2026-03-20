import {
  pgTable,
  bigserial,
  bigint,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Phone configurations table
 *
 * Sensitive fields:
 * - encrypted_phone (KMS encrypted)
 */
export const phoneConfigurations = pgTable(
  'phone_configurations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    // Sensitive: KMS-encrypted phone number
    encryptedPhone: text('encrypted_phone').notNull(),
    deliveryPreference: integer('delivery_preference').default(0).notNull(),
    mfaEnabled: boolean('mfa_enabled').default(true).notNull(),
    confirmedAt: timestamp('confirmed_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    madeDefaultAt: timestamp('made_default_at'),
  },
  (table) => [
    index('index_phone_configurations_on_made_default_at').on(
      table.userId,
      table.madeDefaultAt,
      table.createdAt
    ),
  ]
);

export const phoneConfigurationsRelations = relations(phoneConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [phoneConfigurations.userId],
    references: [users.id],
  }),
}));

/**
 * Delivery preference enum
 */
export const DeliveryPreference = {
  SMS: 0,
  VOICE: 1,
} as const;

/**
 * Phone number opt-outs table
 * Tracks users who have opted out of SMS
 */
export const phoneNumberOptOuts = pgTable(
  'phone_number_opt_outs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    // Sensitive: Encrypted phone
    encryptedPhone: varchar('encrypted_phone'),
    // Sensitive: Fingerprint for lookups
    phoneFingerprint: varchar('phone_fingerprint').notNull(),
    uuid: varchar('uuid'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_phone_number_opt_outs_on_phone_fingerprint').on(table.phoneFingerprint),
    uniqueIndex('index_phone_number_opt_outs_on_uuid').on(table.uuid),
  ]
);

export type PhoneConfiguration = typeof phoneConfigurations.$inferSelect;
export type NewPhoneConfiguration = typeof phoneConfigurations.$inferInsert;
