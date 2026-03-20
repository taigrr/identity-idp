import {
  pgTable,
  serial,
  bigserial,
  integer,
  bigint,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { devices } from './devices';

/**
 * Events table - User activity events for security
 *
 * Sensitive fields:
 * - disavowal_token_fingerprint
 */
export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    eventType: integer('event_type').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    deviceId: integer('device_id').references(() => devices.id),
    ip: varchar('ip'),
    disavowedAt: timestamp('disavowed_at'),
    // Sensitive: Token fingerprint for event disavowal
    disavowalTokenFingerprint: varchar('disavowal_token_fingerprint'),
  },
  (table) => [
    index('index_events_on_device_id_and_created_at').on(table.deviceId, table.createdAt),
    index('index_events_on_disavowal_token_fingerprint').on(table.disavowalTokenFingerprint),
    index('index_events_on_user_id_and_created_at').on(table.userId, table.createdAt),
  ]
);

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [events.deviceId],
    references: [devices.id],
  }),
}));

/**
 * Event types enum
 */
export const EventType = {
  EMAIL_CHANGED: 0,
  PASSWORD_CHANGED: 1,
  PHONE_CHANGED: 2,
  ACCOUNT_CREATED: 3,
  TOTP_ENABLED: 4,
  TOTP_DISABLED: 5,
  WEBAUTHN_KEY_ADDED: 6,
  WEBAUTHN_KEY_REMOVED: 7,
  PIV_CAC_ENABLED: 8,
  PIV_CAC_DISABLED: 9,
  BACKUP_CODES_REGENERATED: 10,
  PERSONAL_KEY_REGENERATED: 11,
  NEW_DEVICE_SIGN_IN: 12,
  SIGN_IN_AFTER_UNLOCK: 13,
} as const;

/**
 * Security events table - RISC/SSF events for service providers
 */
export const securityEvents = pgTable(
  'security_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    eventType: varchar('event_type').notNull(),
    jti: varchar('jti'),
    issuer: varchar('issuer'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    occurredAt: timestamp('occurred_at'),
  },
  (table) => [
    uniqueIndex('index_security_events_on_jti_and_user_id_and_issuer').on(
      table.jti,
      table.userId,
      table.issuer
    ),
    index('index_security_events_on_user_id').on(table.userId),
  ]
);

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}));

/**
 * Security event types (RISC)
 */
export const SecurityEventType = {
  ACCOUNT_PURGED: 'https://schemas.openid.net/secevent/risc/event-type/account-purged',
  ACCOUNT_DISABLED: 'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
  ACCOUNT_ENABLED: 'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
  IDENTIFIER_RECYCLED: 'https://schemas.openid.net/secevent/risc/event-type/identifier-recycled',
  CREDENTIAL_COMPROMISE: 'https://schemas.openid.net/secevent/risc/event-type/credential-compromise',
  RECOVERY_ACTIVATED: 'https://schemas.openid.net/secevent/risc/event-type/recovery-activated',
  RECOVERY_INFORMATION_CHANGED:
    'https://schemas.openid.net/secevent/risc/event-type/recovery-information-changed',
} as const;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
