import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  text,
  json,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Identities table - OAuth/SAML sessions with Service Providers
 *
 * Represents the relationship between a user and a service provider (SP)
 * Contains OAuth tokens and SAML session information
 *
 * Sensitive fields:
 * - session_uuid
 * - nonce
 * - access_token
 * - code_challenge
 * - rails_session_id
 */
export const identities = pgTable(
  'identities',
  {
    id: serial('id').primaryKey(),
    serviceProvider: varchar('service_provider', { length: 255 }),
    lastAuthenticatedAt: timestamp('last_authenticated_at'),
    userId: integer('user_id').references(() => users.id),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    // Sensitive: Session identifier
    sessionUuid: varchar('session_uuid', { length: 255 }),
    uuid: varchar('uuid').notNull(),
    // Sensitive: OAuth nonce
    nonce: varchar('nonce'),
    ial: integer('ial').default(1),
    // Sensitive: OAuth access token
    accessToken: varchar('access_token'),
    scope: varchar('scope'),
    // Sensitive: PKCE code challenge
    codeChallenge: varchar('code_challenge'),
    // Sensitive: Rails session ID
    railsSessionId: varchar('rails_session_id'),
    verifiedAttributes: json('verified_attributes'),
    verifiedAt: timestamp('verified_at'),
    lastConsentedAt: timestamp('last_consented_at'),
    lastIal1AuthenticatedAt: timestamp('last_ial1_authenticated_at'),
    lastIal2AuthenticatedAt: timestamp('last_ial2_authenticated_at'),
    deletedAt: timestamp('deleted_at'),
    aal: integer('aal'),
    requestedAalValue: text('requested_aal_value'),
    vtr: varchar('vtr'),
    acrValues: varchar('acr_values'),
    emailAddressId: bigint('email_address_id', { mode: 'number' }),
  },
  (table) => [
    uniqueIndex('index_identities_on_access_token').on(table.accessToken),
    uniqueIndex('index_identities_on_session_uuid').on(table.sessionUuid),
    uniqueIndex('index_identities_on_user_id_and_service_provider').on(
      table.userId,
      table.serviceProvider
    ),
    uniqueIndex('index_identities_on_uuid').on(table.uuid),
  ]
);

export const identitiesRelations = relations(identities, ({ one }) => ({
  user: one(users, {
    fields: [identities.userId],
    references: [users.id],
  }),
}));

/**
 * IAL (Identity Assurance Level) enum
 */
export const IAL = {
  IAL1: 1, // Self-asserted identity
  IAL2: 2, // Identity proofed
} as const;

/**
 * AAL (Authenticator Assurance Level) enum
 */
export const AAL = {
  AAL1: 1, // Single factor
  AAL2: 2, // Two factors
  AAL3: 3, // Hardware-bound authenticator
} as const;

export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;
