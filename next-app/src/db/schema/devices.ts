import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Devices table - Tracks user devices for security
 */
export const devices = pgTable(
  'devices',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    cookieUuid: varchar('cookie_uuid').notNull(),
    userAgent: varchar('user_agent').notNull(),
    lastUsedAt: timestamp('last_used_at').notNull(),
    lastIp: varchar('last_ip', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('index_devices_on_cookie_uuid').on(table.cookieUuid),
    index('index_device_user_id_last_used_at').on(table.userId, table.lastUsedAt),
  ]
);

export const devicesRelations = relations(devices, ({ one, many }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
  events: many(events),
}));

import { events } from './security-events';

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
