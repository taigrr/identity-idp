/**
 * i18n Module
 * Mirrors: Rails I18n with config/locales/*.yml
 *
 * Uses next-intl for internationalization
 */

import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es', 'fr', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => ({
  locale: locale || defaultLocale,
  messages: (await import(`../../messages/${locale || defaultLocale}.json`)).default,
}));
