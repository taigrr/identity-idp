import {
  pgTable,
  serial,
  bigserial,
  bigint,
  varchar,
  text,
  integer,
  date,
  decimal,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Agencies table
 * Government agencies that use Login.gov
 */
export const agencies = pgTable(
  'agencies',
  {
    id: serial('id').primaryKey(),
    name: varchar('name').notNull(),
    abbreviation: varchar('abbreviation'),
  },
  (table) => [
    uniqueIndex('index_agencies_on_abbreviation').on(table.abbreviation),
    uniqueIndex('index_agencies_on_name').on(table.name),
    check('agencies_abbreviation_null', sql`abbreviation IS NOT NULL`),
  ]
);

export const agenciesRelations = relations(agencies, ({ many }) => ({
  partnerAccounts: many(partnerAccounts),
  agencyIdentities: many(agencyIdentities),
}));

/**
 * Agency identities table
 * Links users to agencies with unique UUIDs
 */
export const agencyIdentities = pgTable(
  'agency_identities',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    agencyId: integer('agency_id')
      .notNull()
      .references(() => agencies.id),
    uuid: varchar('uuid').notNull(),
  },
  (table) => [
    uniqueIndex('index_agency_identities_on_user_id_and_agency_id').on(table.userId, table.agencyId),
    uniqueIndex('index_agency_identities_on_uuid').on(table.uuid),
  ]
);

/**
 * Partner account statuses table
 */
export const partnerAccountStatuses = pgTable(
  'partner_account_statuses',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name').notNull(),
    order: integer('order').notNull(),
    partnerName: varchar('partner_name'),
  },
  (table) => [
    uniqueIndex('index_partner_account_statuses_on_name').on(table.name),
    uniqueIndex('index_partner_account_statuses_on_order').on(table.order),
  ]
);

/**
 * Partner accounts table
 */
export const partnerAccounts = pgTable(
  'partner_accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name').notNull(),
    description: text('description'),
    requestingAgency: varchar('requesting_agency').notNull(),
    becamePartner: date('became_partner'),
    agencyId: bigint('agency_id', { mode: 'number' }).references(() => agencies.id),
    partnerAccountStatusId: bigint('partner_account_status_id', { mode: 'number' }).references(
      () => partnerAccountStatuses.id
    ),
    crmId: bigint('crm_id', { mode: 'number' }),
  },
  (table) => [
    index('index_partner_accounts_on_agency_id').on(table.agencyId),
    uniqueIndex('index_partner_accounts_on_name').on(table.name),
    index('index_partner_accounts_on_partner_account_status_id').on(table.partnerAccountStatusId),
    uniqueIndex('index_partner_accounts_on_requesting_agency').on(table.requestingAgency),
  ]
);

export const partnerAccountsRelations = relations(partnerAccounts, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [partnerAccounts.agencyId],
    references: [agencies.id],
  }),
  status: one(partnerAccountStatuses, {
    fields: [partnerAccounts.partnerAccountStatusId],
    references: [partnerAccountStatuses.id],
  }),
  iaaGtcs: many(iaaGtcs),
}));

/**
 * IAA GTCs (General Terms and Conditions)
 */
export const iaaGtcs = pgTable(
  'iaa_gtcs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    gtcNumber: varchar('gtc_number').notNull(),
    modNumber: integer('mod_number').default(0).notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    estimatedAmount: decimal('estimated_amount', { precision: 12, scale: 2 }),
    partnerAccountId: bigint('partner_account_id', { mode: 'number' }).references(
      () => partnerAccounts.id
    ),
  },
  (table) => [
    uniqueIndex('index_iaa_gtcs_on_gtc_number').on(table.gtcNumber),
    index('index_iaa_gtcs_on_partner_account_id').on(table.partnerAccountId),
    check('iaa_gtcs_end_date_null', sql`end_date IS NOT NULL`),
    check('iaa_gtcs_start_date_null', sql`start_date IS NOT NULL`),
  ]
);

/**
 * IAA Orders
 */
export const iaaOrders = pgTable(
  'iaa_orders',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    orderNumber: integer('order_number').notNull(),
    modNumber: integer('mod_number').default(0).notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    estimatedAmount: decimal('estimated_amount', { precision: 12, scale: 2 }),
    pricingModel: integer('pricing_model').default(2).notNull(),
    iaaGtcId: bigint('iaa_gtc_id', { mode: 'number' }).references(() => iaaGtcs.id),
  },
  (table) => [
    uniqueIndex('index_iaa_orders_on_iaa_gtc_id_and_order_number').on(
      table.iaaGtcId,
      table.orderNumber
    ),
    index('index_iaa_orders_on_iaa_gtc_id').on(table.iaaGtcId),
    check('iaa_orders_end_date_null', sql`end_date IS NOT NULL`),
    check('iaa_orders_start_date_null', sql`start_date IS NOT NULL`),
  ]
);

/**
 * Integration statuses table
 */
export const integrationStatuses = pgTable(
  'integration_statuses',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name').notNull(),
    order: integer('order').notNull(),
    partnerName: varchar('partner_name'),
  },
  (table) => [
    uniqueIndex('index_integration_statuses_on_name').on(table.name),
    uniqueIndex('index_integration_statuses_on_order').on(table.order),
  ]
);

/**
 * Integrations table
 */
export const integrations = pgTable(
  'integrations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    issuer: varchar('issuer').notNull(),
    name: varchar('name').notNull(),
    dashboardIdentifier: integer('dashboard_identifier'),
    partnerAccountId: bigint('partner_account_id', { mode: 'number' }).references(
      () => partnerAccounts.id
    ),
    integrationStatusId: bigint('integration_status_id', { mode: 'number' }).references(
      () => integrationStatuses.id
    ),
    serviceProviderId: bigint('service_provider_id', { mode: 'number' }),
  },
  (table) => [
    uniqueIndex('index_integrations_on_dashboard_identifier').on(table.dashboardIdentifier),
    index('index_integrations_on_integration_status_id').on(table.integrationStatusId),
    uniqueIndex('index_integrations_on_issuer').on(table.issuer),
    index('index_integrations_on_partner_account_id').on(table.partnerAccountId),
    index('index_integrations_on_service_provider_id').on(table.serviceProviderId),
  ]
);

/**
 * Integration usages table
 */
export const integrationUsages = pgTable(
  'integration_usages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    iaaOrderId: bigint('iaa_order_id', { mode: 'number' }).references(() => iaaOrders.id),
    integrationId: bigint('integration_id', { mode: 'number' }).references(() => integrations.id),
  },
  (table) => [
    uniqueIndex('index_integration_usages_on_iaa_order_id_and_integration_id').on(
      table.iaaOrderId,
      table.integrationId
    ),
    index('index_integration_usages_on_iaa_order_id').on(table.iaaOrderId),
    index('index_integration_usages_on_integration_id').on(table.integrationId),
  ]
);

export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
