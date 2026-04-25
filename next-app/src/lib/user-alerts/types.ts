/**
 * User Alerts - Send notifications to users about account events
 * Mirrors: app/services/user_alerts/*.rb
 */

/**
 * Email address record
 */
export interface EmailAddress {
  id: string;
  email: string;
  confirmed: boolean;
}

/**
 * User record with email addresses
 */
export interface AlertUser {
  id: string;
  uuid: string;
  confirmed_email_addresses: EmailAddress[];
  sign_in_new_device_at?: Date;
}

/**
 * Profile for verification alerts
 */
export interface AlertProfile {
  id: string;
  user: AlertUser;
}

/**
 * Device record
 */
export interface Device {
  id: string;
  user_agent?: string;
  last_ip?: string;
}

/**
 * Sign-in event record
 */
export interface SignInEvent {
  id: string;
  created_at: Date;
  event_type: string;
  device?: Device;
}

/**
 * Phone configuration
 */
export interface PhoneConfiguration {
  id: string;
  phone: string;
}

/**
 * Form response type
 */
export interface AlertFormResponse {
  success: boolean;
  extra?: Record<string, unknown>;
}

/**
 * Mailer interface for sending emails
 */
export interface UserMailer {
  passwordChanged(params: { disavowalToken: string }): Promise<void>;
  accountVerified(params: { profile: AlertProfile }): Promise<void>;
  accountRejected(): Promise<void>;
  personalKeySignIn(params: { disavowalToken: string }): Promise<void>;
  newDeviceSignInBefore2fa(params: {
    events: SignInEvent[];
    disavowalToken: string;
  }): Promise<void>;
  newDeviceSignInAfter2fa(params: {
    events: SignInEvent[];
    disavowalToken: string;
  }): Promise<void>;
}

/**
 * SMS sender interface
 */
export interface SmsSender {
  sendPersonalKeySignInNotice(params: { to: string; countryCode: string }): Promise<{
    success: boolean;
    messageId?: string;
  }>;
}

/**
 * Analytics interface
 */
export interface AlertAnalytics {
  newDeviceAlertSkipped(): void;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  newDeviceAlertDelayMinutes: number;
}

/**
 * Get alert config from environment
 */
export function getAlertConfig(): AlertConfig {
  return {
    newDeviceAlertDelayMinutes: Number(process.env.NEW_DEVICE_ALERT_DELAY_IN_MINUTES) || 10,
  };
}
