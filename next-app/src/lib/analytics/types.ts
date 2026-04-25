/**
 * Analytics types - mirrors Ruby's Analytics class structure
 * @see app/services/analytics.rb
 * @see app/services/analytics_events.rb
 */

export interface AnalyticsUser {
  uuid: string;
  email?: string;
}

export interface AnalyticsRequest {
  path?: string;
  userAgent?: string;
  remoteIp?: string;
  host?: string;
  headers?: Record<string, string>;
}

export interface AnalyticsSession {
  sessionStartedAt?: Date;
  events?: Record<string, boolean>;
  firstEvent?: boolean;
  sp?: {
    issuer?: string;
    requestUrl?: string;
    acrValues?: string;
  };
}

export interface BrowserAttributes {
  userAgent?: string;
  browserName?: string;
  browserVersion?: string;
  browserPlatformName?: string;
  browserPlatformVersion?: string;
  browserDeviceName?: string;
  browserMobile?: boolean;
  browserBot?: boolean;
}

export interface SpRequestAttributes {
  componentValues?: Record<string, boolean>;
  componentNames?: string[];
  appDifferentiator?: string;
  [key: string]: unknown;
}

export interface AbTestBucket {
  bucket: string;
}

export interface AnalyticsEventData {
  eventProperties: Record<string, unknown>;
  newEvent: boolean;
  path?: string;
  serviceProvider?: string;
  sessionDuration?: number;
  userId: string;
  locale: string;
  userIp?: string;
  hostname?: string;
  pid?: number;
  traceId?: string;
  gitSha?: string;
  gitBranch?: string;
  browserAttributes?: BrowserAttributes;
  spRequest?: SpRequestAttributes;
  abTests?: Record<string, AbTestBucket>;
}

export interface LoggedEvent {
  id: string;
  name: string;
  time: Date;
  visitorId?: string;
  visitId?: string;
  logFilename: string;
  properties: AnalyticsEventData;
}

// Common event attribute types
export interface FormValidationResult {
  success: boolean;
  errors?: Record<string, string[]>;
  errorDetails?: Record<string, unknown>;
}

export interface ProofingComponents {
  documentCheck?: string;
  documentTypeReceived?: string;
  sourceCheck?: string;
  resolutionCheck?: string;
  addressCheck?: string;
  threatmetrix?: boolean;
  threatmetrixReviewStatus?: string;
}

export interface MfaMethodCounts {
  phone?: number;
  totp?: number;
  webauthn?: number;
  webauthnPlatform?: number;
  backupCodes?: number;
  pivCac?: number;
}

// Flow paths for document capture
export type FlowPath = 'hybrid' | 'standard';

// Document types
export type DocumentType = 'drivers_license' | 'passport';

// Error details commonly used
export interface ErrorDetails {
  [field: string]: {
    type: string;
    message?: string;
  };
}
