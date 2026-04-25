/**
 * Core Analytics class - mirrors Ruby's Analytics
 * @see app/services/analytics.rb
 */

import { randomUUID } from 'crypto';
import { analyticsConfig } from './config';
import { parseBrowser } from './browser';
import { logEvent, shouldExcludeEvent } from './logger';
import type {
  AnalyticsUser,
  AnalyticsRequest,
  AnalyticsSession,
  AnalyticsEventData,
  BrowserAttributes,
  LoggedEvent,
} from './types';

export interface AnalyticsOptions {
  user?: AnalyticsUser;
  request?: AnalyticsRequest;
  serviceProvider?: string;
  session?: AnalyticsSession;
  visitorToken?: string;
  visitToken?: string;
}

export class Analytics {
  private user?: AnalyticsUser;
  private request?: AnalyticsRequest;
  private serviceProvider?: string;
  private session: AnalyticsSession;
  private visitorToken?: string;
  private visitToken?: string;
  private locale: string;

  constructor(options: AnalyticsOptions = {}) {
    this.user = options.user;
    this.request = options.request;
    this.serviceProvider = options.serviceProvider;
    this.session = options.session || {};
    this.visitorToken = options.visitorToken;
    this.visitToken = options.visitToken;
    this.locale = 'en';
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  trackEvent(eventName: string, attributes: Record<string, unknown> = {}): void {
    if (shouldExcludeEvent(this.visitorToken, this.visitToken)) {
      return;
    }

    const { pii_like_keypaths: _pii, ...safeAttributes } = attributes;

    if (attributes.success !== false) {
      this.updateSessionEventsAndPathsVisited(eventName);
    }

    const analyticsHash = this.buildAnalyticsHash(safeAttributes);
    const loggedEvent = this.buildLoggedEvent(eventName, analyticsHash);

    logEvent(loggedEvent);
  }

  private updateSessionEventsAndPathsVisited(eventName: string): void {
    this.session.events = this.session.events || {};
    this.session.firstEvent = !this.session.events[eventName];
    this.session.events[eventName] = true;
  }

  private firstEventThisSession(): boolean {
    return this.session.firstEvent ?? true;
  }

  private buildAnalyticsHash(attributes: Record<string, unknown>): AnalyticsEventData {
    const { userId, ...eventProps } = attributes as { userId?: string } & Record<string, unknown>;

    const hash: AnalyticsEventData = {
      eventProperties: this.compactObject(eventProps),
      newEvent: this.firstEventThisSession(),
      path: this.request?.path,
      serviceProvider: this.serviceProvider,
      sessionDuration: this.sessionDuration(),
      userId: userId || this.user?.uuid || 'anonymous',
      locale: this.locale,
    };

    if (this.request) {
      Object.assign(hash, this.requestAttributes());
    }

    return hash;
  }

  private requestAttributes(): Partial<AnalyticsEventData> & { browserAttributes: BrowserAttributes } {
    const browser = parseBrowser(this.request?.userAgent);

    return {
      userIp: this.request?.remoteIp,
      hostname: this.request?.host,
      pid: process.pid,
      traceId: this.request?.headers?.['x-amzn-trace-id'],
      gitSha: analyticsConfig.gitSha,
      gitBranch: analyticsConfig.gitBranch,
      browserAttributes: {
        userAgent: this.request?.userAgent,
        browserName: browser.name,
        browserVersion: browser.fullVersion,
        browserPlatformName: browser.platform.name,
        browserPlatformVersion: browser.platform.version,
        browserDeviceName: browser.device.name,
        browserMobile: browser.device.mobile,
        browserBot: browser.bot,
      },
    };
  }

  private sessionDuration(): number | undefined {
    if (!this.session.sessionStartedAt) return undefined;
    const startTime =
      this.session.sessionStartedAt instanceof Date
        ? this.session.sessionStartedAt
        : new Date(this.session.sessionStartedAt);
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
  }

  private buildLoggedEvent(eventName: string, analyticsHash: AnalyticsEventData): LoggedEvent {
    return {
      id: randomUUID(),
      name: eventName,
      time: new Date(),
      visitorId: this.visitorToken,
      visitId: this.visitToken,
      logFilename: analyticsConfig.logFilename,
      properties: analyticsHash,
    };
  }

  private compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
    ) as Partial<T>;
  }
}
