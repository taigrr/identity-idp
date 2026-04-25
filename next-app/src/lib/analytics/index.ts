/**
 * Analytics module - mirrors Rails Analytics class
 * @see app/services/analytics.rb
 * @see app/services/analytics_events.rb
 * @see config/initializers/ahoy.rb
 *
 * Usage:
 *
 * import { createAnalytics } from '@/lib/analytics';
 *
 * const analytics = createAnalytics({
 *   user: { uuid: 'user-uuid' },
 *   request: { path: '/sign-in', userAgent: '...' },
 *   serviceProvider: 'urn:gov:gsa:openidconnect.profiles:sp:sso:agency:app',
 *   session: { sessionStartedAt: new Date() },
 * });
 *
 * analytics.emailAndPasswordAuth({
 *   success: true,
 *   userLockedOut: false,
 *   rateLimited: false,
 *   validCaptchaResult: true,
 *   captchaValidationPerformed: false,
 *   signInFailureCount: 0,
 *   spRequestUrlPresent: true,
 *   rememberDevice: false,
 *   newDevice: true,
 * });
 */

export { Analytics, type AnalyticsOptions } from './analytics';
export { AnalyticsEvents } from './idv-events';
export { AnalyticsWithEvents } from './events';
export { analyticsConfig } from './config';
export { logEvent, isValidUuid, shouldExcludeEvent } from './logger';
export { parseBrowser, type ParsedBrowser } from './browser';
export * from './types';

import { AnalyticsEvents } from './idv-events';
import type { AnalyticsOptions } from './analytics';

/**
 * Create an analytics instance with all event methods
 */
export function createAnalytics(options: AnalyticsOptions = {}): AnalyticsEvents {
  return new AnalyticsEvents(options);
}

/**
 * Create analytics from Next.js request context
 */
export function createAnalyticsFromRequest(
  request: Request,
  options: Omit<AnalyticsOptions, 'request'> = {}
): AnalyticsEvents {
  const url = new URL(request.url);

  return createAnalytics({
    ...options,
    request: {
      path: url.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      remoteIp:
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        undefined,
      host: url.host,
      headers: Object.fromEntries(request.headers.entries()),
    },
    visitorToken: request.headers.get('x-visitor-token') || undefined,
    visitToken: request.headers.get('x-visit-token') || undefined,
  });
}
