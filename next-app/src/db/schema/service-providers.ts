import {
  pgTable,
  serial,
  bigserial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  json,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';

/**
 * Service providers table - OAuth/SAML relying parties
 *
 * Sensitive fields:
 * - block_encryption (encryption config)
 */
export const serviceProviders = pgTable(
  'service_providers',
  {
    id: serial('id').primaryKey(),
    issuer: varchar('issuer').notNull(),
    friendlyName: varchar('friendly_name'),
    description: text('description'),
    metadataUrl: text('metadata_url'),
    acsUrl: text('acs_url'),
    assertionConsumerLogoutServiceUrl: text('assertion_consumer_logout_service_url'),
    logo: text('logo'),
    signature: varchar('signature'),
    // Sensitive: Block encryption setting
    blockEncryption: varchar('block_encryption').default('aes256-cbc').notNull(),
    spInitiatedLoginUrl: text('sp_initiated_login_url'),
    returnToSpUrl: text('return_to_sp_url'),
    attributeBundle: json('attribute_bundle'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    active: boolean('active').default(false).notNull(),
    approved: boolean('approved').default(false).notNull(),
    native: boolean('native').default(false).notNull(),
    redirectUris: varchar('redirect_uris').array().default([]),
    agencyId: integer('agency_id').references(() => agencies.id),
    failureToProofUrl: text('failure_to_proof_url'),
    ial: integer('ial'),
    pivCac: boolean('piv_cac').default(false),
    pivCacScopedByEmail: boolean('piv_cac_scoped_by_email').default(false),
    pkce: boolean('pkce'),
    pushNotificationUrl: varchar('push_notification_url'),
    helpText: jsonb('help_text').default({
      sign_in: {},
      sign_up: {},
      forgot_password: {},
    }),
    allowPromptLogin: boolean('allow_prompt_login').default(false),
    signedResponseMessageRequested: boolean('signed_response_message_requested').default(false),
    remoteLogoKey: varchar('remote_logo_key'),
    launchDate: date('launch_date'),
    iaa: varchar('iaa'),
    iaaStartDate: date('iaa_start_date'),
    iaaEndDate: date('iaa_end_date'),
    appId: varchar('app_id'),
    defaultAal: integer('default_aal'),
    certs: varchar('certs').array(),
    emailNameidFormatAllowed: boolean('email_nameid_format_allowed').default(false),
    useLegacyNameIdBehavior: boolean('use_legacy_name_id_behavior').default(false),
    irsAttemptsApiEnabled: boolean('irs_attempts_api_enabled'),
    inPersonProofingEnabled: boolean('in_person_proofing_enabled').default(false),
    postIdvFollowUpUrl: varchar('post_idv_follow_up_url'),
    samlEmailaddressAttributeEnabled: boolean('saml_emailaddress_attribute_enabled').default(false),
  },
  (table) => [uniqueIndex('index_service_providers_on_issuer').on(table.issuer)]
);

export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [serviceProviders.agencyId],
    references: [agencies.id],
  }),
  integrations: many(integrations),
  inPersonEnrollments: many(inPersonEnrollments),
}));

/**
 * Sign-in restrictions table
 * Tracks users restricted from specific service providers
 */
export const signInRestrictions = pgTable(
  'sign_in_restrictions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: integer('user_id').notNull(),
    serviceProvider: varchar('service_provider'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('index_sign_in_restrictions_on_user_id_and_service_provider').on(
      table.userId,
      table.serviceProvider
    ),
  ]
);

// Forward declarations
import { integrations } from './agencies';
import { inPersonEnrollments } from './in-person-enrollments';

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;
