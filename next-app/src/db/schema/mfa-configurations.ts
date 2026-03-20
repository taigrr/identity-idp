import {
  pgTable,
  serial,
  bigserial,
  integer,
  bigint,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Auth app (TOTP) configurations
 *
 * Sensitive fields:
 * - encrypted_otp_secret_key (KMS encrypted)
 * - name (user-provided, potentially sensitive)
 */
export const authAppConfigurations = pgTable(
  'auth_app_configurations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    // Sensitive: KMS-encrypted TOTP secret
    encryptedOtpSecretKey: varchar('encrypted_otp_secret_key').notNull(),
    // Sensitive: User-provided name
    name: varchar('name', { length: 80 }).notNull(),
    totpTimestamp: integer('totp_timestamp'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_auth_app_configurations_on_user_id_and_created_at').on(
      table.userId,
      table.createdAt
    ),
    uniqueIndex('index_auth_app_configurations_on_user_id_and_name').on(table.userId, table.name),
  ]
);

export const authAppConfigurationsRelations = relations(authAppConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [authAppConfigurations.userId],
    references: [users.id],
  }),
}));

/**
 * WebAuthn (security keys, passkeys) configurations
 *
 * Sensitive fields:
 * - name (user-provided)
 */
export const webauthnConfigurations = pgTable(
  'webauthn_configurations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    // Sensitive: User-provided name
    name: varchar('name', { length: 80 }).notNull(),
    credentialId: text('credential_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    platformAuthenticator: boolean('platform_authenticator'),
    transports: varchar('transports').array(),
    authenticatorDataFlags: jsonb('authenticator_data_flags'),
    aaguid: varchar('aaguid'),
  },
  (table) => [index('index_webauthn_configurations_on_user_id').on(table.userId)]
);

export const webauthnConfigurationsRelations = relations(webauthnConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [webauthnConfigurations.userId],
    references: [users.id],
  }),
}));

/**
 * PIV/CAC (Smart card) configurations
 */
export const pivCacConfigurations = pgTable(
  'piv_cac_configurations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    x509DnUuid: varchar('x509_dn_uuid').notNull(),
    // Sensitive: User-provided name
    name: varchar('name', { length: 80 }).notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    x509Issuer: varchar('x509_issuer'),
  },
  (table) => [
    uniqueIndex('index_piv_cac_configurations_on_user_id_and_created_at').on(
      table.userId,
      table.createdAt
    ),
    uniqueIndex('index_piv_cac_configurations_on_user_id_and_name').on(table.userId, table.name),
    uniqueIndex('index_piv_cac_configurations_on_x509_dn_uuid').on(table.x509DnUuid),
  ]
);

export const pivCacConfigurationsRelations = relations(pivCacConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [pivCacConfigurations.userId],
    references: [users.id],
  }),
}));

/**
 * Backup code configurations
 *
 * Sensitive fields:
 * - code_salt (encryption salt)
 */
export const backupCodeConfigurations = pgTable(
  'backup_code_configurations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    saltedCodeFingerprint: varchar('salted_code_fingerprint'),
    // Sensitive: Salt for code hashing
    codeSalt: varchar('code_salt'),
    codeCost: varchar('code_cost'),
  },
  (table) => [
    index('index_backup_code_configurations_on_user_id_and_created_at').on(
      table.userId,
      table.createdAt
    ),
    index('index_backup_codes_on_user_id_and_salted_code_fingerprint').on(
      table.userId,
      table.saltedCodeFingerprint
    ),
  ]
);

export const backupCodeConfigurationsRelations = relations(backupCodeConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [backupCodeConfigurations.userId],
    references: [users.id],
  }),
}));

/**
 * Personal key configuration (for account recovery)
 * Note: This is separate from backup codes
 */
export const personalKeyConfigurations = pgTable('personal_key_configurations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  // Sensitive: Encrypted personal key
  encryptedPersonalKey: text('encrypted_personal_key'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export type AuthAppConfiguration = typeof authAppConfigurations.$inferSelect;
export type NewAuthAppConfiguration = typeof authAppConfigurations.$inferInsert;
export type WebauthnConfiguration = typeof webauthnConfigurations.$inferSelect;
export type NewWebauthnConfiguration = typeof webauthnConfigurations.$inferInsert;
export type PivCacConfiguration = typeof pivCacConfigurations.$inferSelect;
export type NewPivCacConfiguration = typeof pivCacConfigurations.$inferInsert;
export type BackupCodeConfiguration = typeof backupCodeConfigurations.$inferSelect;
export type NewBackupCodeConfiguration = typeof backupCodeConfigurations.$inferInsert;
