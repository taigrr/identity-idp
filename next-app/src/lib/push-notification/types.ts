/**
 * Push Notification Types - Security Event Token (SET) types
 * Mirrors: app/services/push_notification/*.rb
 *
 * Implements RISC (Risk and Incident Sharing and Coordination) protocol
 * https://tools.ietf.org/html/draft-ietf-secevent-http-push-00
 */

/**
 * User reference for push notification events
 */
export interface PushNotificationUser {
  id: string;
  uuid: string;
}

/**
 * Service Provider for push notification delivery
 */
export interface PushNotificationServiceProvider {
  issuer: string;
  push_notification_url?: string;
  agency_id?: string;
  receives_client_id_in_risc: boolean;
}

/**
 * Subject types for RISC events
 */
export type RiscSubjectType = 'iss-sub' | 'email';

/**
 * Base subject structure for RISC events
 */
export interface RiscSubject {
  subject_type: RiscSubjectType;
}

/**
 * Issuer-Subject subject type
 */
export interface IssSubSubject extends RiscSubject {
  subject_type: 'iss-sub';
  iss: string;
  sub: string;
}

/**
 * Email subject type
 */
export interface EmailSubject extends RiscSubject {
  subject_type: 'email';
  email: string;
}

/**
 * Event payload structure
 */
export interface RiscEventPayload {
  subject: IssSubSubject | EmailSubject;
}

/**
 * RISC Event Types - Standard and Login.gov custom types
 */
export const RISC_EVENT_TYPES = {
  // Standard RISC event types
  ACCOUNT_PURGED: 'https://schemas.openid.net/secevent/risc/event-type/account-purged',
  ACCOUNT_DISABLED: 'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
  ACCOUNT_ENABLED: 'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
  IDENTIFIER_RECYCLED: 'https://schemas.openid.net/secevent/risc/event-type/identifier-recycled',
  RECOVERY_ACTIVATED: 'https://schemas.openid.net/secevent/risc/event-type/recovery-activated',
  RECOVERY_INFORMATION_CHANGED: 'https://schemas.openid.net/secevent/risc/event-type/recovery-information-changed',

  // Login.gov custom event types
  PASSWORD_RESET: 'https://schemas.login.gov/secevent/risc/event-type/password-reset',
  EMAIL_CHANGED: 'https://schemas.login.gov/secevent/risc/event-type/email-changed',
  MFA_LIMIT_ACCOUNT_LOCKED: 'https://schemas.login.gov/secevent/risc/event-type/mfa-limit-account-locked',
  REPROOF_COMPLETED: 'https://schemas.login.gov/secevent/risc/event-type/reproof-completed',
} as const;

export type RiscEventType = typeof RISC_EVENT_TYPES[keyof typeof RISC_EVENT_TYPES];

/**
 * JWT payload for Security Event Token (SET)
 */
export interface SetJwtPayload {
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  aud: string;
  events: Record<string, RiscEventPayload>;
}

/**
 * Base interface for push notification events
 */
export interface PushNotificationEvent {
  user: PushNotificationUser;
  eventType: RiscEventType;
  payload(issSub: string): RiscEventPayload;
}

/**
 * Local event queue entry (for testing/development)
 */
export interface LocalEventEntry {
  url: string;
  payload: SetJwtPayload;
  jwt: string;
}

/**
 * RISC delivery job parameters
 */
export interface RiscDeliveryJobParams {
  pushNotificationUrl: string;
  jwt: string;
  eventType: RiscEventType;
  issuer: string;
}

/**
 * Push notification configuration
 */
export interface PushNotificationConfig {
  enabled: boolean;
  localEnabled: boolean;
  sendClientIdInAud: boolean;
  rootUrl: string;
}

/**
 * Get push notification config from environment
 */
export function getPushNotificationConfig(): PushNotificationConfig {
  return {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    localEnabled: process.env.RISC_NOTIFICATIONS_LOCAL_ENABLED === 'true',
    sendClientIdInAud: process.env.RISC_NOTIFICATIONS_SEND_CLIENT_ID_IN_AUD_ENABLED === 'true',
    rootUrl: process.env.ROOT_URL || 'https://secure.login.gov/',
  };
}
