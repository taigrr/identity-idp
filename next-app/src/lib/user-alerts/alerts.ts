/**
 * User Alerts - Alert implementations
 * Mirrors: app/services/user_alerts/*.rb
 */

import type {
  AlertUser,
  AlertProfile,
  SignInEvent,
  PhoneConfiguration,
  UserMailer,
  SmsSender,
  AlertAnalytics,
  AlertFormResponse,
} from './types';
import { getAlertConfig } from './types';

/**
 * Dependencies for alert services
 */
export interface AlertDependencies {
  mailer: UserMailer;
  smsSender?: SmsSender;
  analytics?: AlertAnalytics;
  updateUser?: (userId: string, data: Partial<AlertUser>) => Promise<void>;
  getSignInEvents?: (userId: string, since: Date, eventTypes: string[]) => Promise<SignInEvent[]>;
  getPhoneConfigurations?: (userId: string) => Promise<PhoneConfiguration[]>;
}

/**
 * Alert User About Password Change
 * Sends email notification when password is changed
 * Mirrors: UserAlerts::AlertUserAboutPasswordChange
 */
export async function alertUserAboutPasswordChange(
  user: AlertUser,
  disavowalToken: string,
  deps: AlertDependencies
): Promise<void> {
  const { mailer } = deps;

  await Promise.all(
    user.confirmed_email_addresses
      .filter(email => email.confirmed)
      .map(email =>
        mailer.passwordChanged({ disavowalToken })
      )
  );
}

/**
 * Alert User About Account Verified
 * Sends email notification when identity verification completes
 * Mirrors: UserAlerts::AlertUserAboutAccountVerified
 */
export async function alertUserAboutAccountVerified(
  profile: AlertProfile,
  deps: AlertDependencies
): Promise<void> {
  const { mailer } = deps;
  const { user } = profile;

  await Promise.all(
    user.confirmed_email_addresses
      .filter(email => email.confirmed)
      .map(email =>
        mailer.accountVerified({ profile })
      )
  );
}

/**
 * Alert User About Account Rejected
 * Sends email notification when identity verification is rejected
 * Mirrors: UserAlerts::AlertUserAboutAccountRejected
 */
export async function alertUserAboutAccountRejected(
  user: AlertUser,
  deps: AlertDependencies
): Promise<void> {
  const { mailer } = deps;

  await Promise.all(
    user.confirmed_email_addresses
      .filter(email => email.confirmed)
      .map(email => mailer.accountRejected())
  );
}

/**
 * Alert User About Personal Key Sign In
 * Sends email and SMS notification when personal key is used to sign in
 * Mirrors: UserAlerts::AlertUserAboutPersonalKeySignIn
 */
export async function alertUserAboutPersonalKeySignIn(
  user: AlertUser,
  disavowalToken: string,
  deps: AlertDependencies
): Promise<AlertFormResponse> {
  const { mailer, smsSender, getPhoneConfigurations } = deps;

  // Send emails
  const emailPromises = user.confirmed_email_addresses
    .filter(email => email.confirmed)
    .map(email =>
      mailer.personalKeySignIn({ disavowalToken })
    );

  await Promise.all(emailPromises);

  // Send SMS messages
  const smsMessageIds: string[] = [];

  if (smsSender && getPhoneConfigurations) {
    const phoneConfigs = await getPhoneConfigurations(user.id);

    for (const phoneConfig of phoneConfigs) {
      try {
        // Extract country code from phone number
        const countryCode = extractCountryCode(phoneConfig.phone);
        const result = await smsSender.sendPersonalKeySignInNotice({
          to: phoneConfig.phone,
          countryCode,
        });

        if (result.messageId) {
          smsMessageIds.push(result.messageId);
        }
      } catch {
        // Continue sending to other phones even if one fails
      }
    }
  }

  return {
    success: true,
    extra: {
      emails: emailPromises.length,
      sms_message_ids: smsMessageIds,
    },
  };
}

/**
 * Schedule New Device Alert
 * Schedules an alert to be sent when a sign-in from a new device is detected
 * Mirrors: UserAlerts::AlertUserAboutNewDevice.schedule_alert
 */
export async function scheduleNewDeviceAlert(
  event: { user: AlertUser; created_at: Date },
  deps: AlertDependencies
): Promise<void> {
  const { updateUser } = deps;

  // Skip if already scheduled
  if (event.user.sign_in_new_device_at) {
    return;
  }

  if (updateUser) {
    await updateUser(event.user.id, {
      sign_in_new_device_at: event.created_at,
    });
  }
}

/**
 * Send New Device Alert
 * Sends the alert for sign-in from a new device
 * Mirrors: UserAlerts::AlertUserAboutNewDevice.send_alert
 */
export async function sendNewDeviceAlert(
  user: AlertUser,
  disavowalEvent: { event_type: string },
  disavowalToken: string,
  deps: AlertDependencies
): Promise<boolean> {
  const { mailer, analytics, updateUser, getSignInEvents } = deps;

  if (!user.sign_in_new_device_at) {
    return false;
  }

  const config = getAlertConfig();
  const startTime = getSignInEventsStartTime(user, config.newDeviceAlertDelayMinutes);

  // Get sign-in events
  const events = getSignInEvents
    ? await getSignInEvents(
        user.id,
        startTime,
        ['sign_in_before_2fa', 'sign_in_unsuccessful_2fa', 'sign_in_after_2fa']
      )
    : [];

  if (events.length === 0) {
    analytics?.newDeviceAlertSkipped();
  } else {
    // Send appropriate email based on event type
    await Promise.all(
      user.confirmed_email_addresses
        .filter(email => email.confirmed)
        .map(async (email) => {
          if (disavowalEvent.event_type === 'sign_in_notification_timeframe_expired') {
            await mailer.newDeviceSignInBefore2fa({
              events,
              disavowalToken,
            });
          } else if (disavowalEvent.event_type === 'sign_in_after_2fa') {
            await mailer.newDeviceSignInAfter2fa({
              events,
              disavowalToken,
            });
          }
        })
    );
  }

  // Clear the scheduled alert
  if (updateUser) {
    await updateUser(user.id, { sign_in_new_device_at: undefined });
  }

  return true;
}

/**
 * Calculate start time for sign-in events query
 * Avoids stale events from server downtime
 */
function getSignInEventsStartTime(user: AlertUser, delayMinutes: number): Date {
  const maxDelayMs = delayMinutes * 3 * 60 * 1000;
  const maxDelayAgo = new Date(Date.now() - maxDelayMs);

  const signInTime = user.sign_in_new_device_at || new Date();

  return signInTime > maxDelayAgo ? signInTime : maxDelayAgo;
}

/**
 * Extract country code from phone number
 */
function extractCountryCode(phone: string): string {
  // Simple extraction - assumes E.164 format
  if (phone.startsWith('+1')) {
    return 'US';
  }

  // Default to US for now - in production this would use a library like libphonenumber
  return 'US';
}
