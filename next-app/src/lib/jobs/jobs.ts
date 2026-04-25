/**
 * Job Definitions
 * Mirrors: app/jobs/*.rb
 *
 * Defines job handlers and enqueueing functions
 */

import { enqueue, scheduleJob, type JobName } from './queue';
import { registerHandler } from './worker';
import { createUserMailer } from '../mailer/user-mailer';
import { sendAuthenticationOtp, sendConfirmationOtp } from '../telephony';

// ============================================================================
// Email Jobs
// ============================================================================

interface SendEmailJobData {
  userId: number;
  userUuid: string;
  email: string;
  emailLanguage?: string;
  emailType: string;
  params: Record<string, unknown>;
}

registerHandler<SendEmailJobData>('sendEmail', async (data) => {
  const user = {
    id: data.userId,
    uuid: data.userUuid,
    email: data.email,
    emailLanguage: data.emailLanguage,
  };
  const emailAddress = { email: data.email };
  const mailer = createUserMailer(user, emailAddress);

  switch (data.emailType) {
    case 'emailConfirmation':
      await mailer.emailConfirmationInstructions(
        data.params.token as string,
        data.params.requestId as string
      );
      break;
    case 'resetPassword':
      await mailer.resetPasswordInstructions(
        data.params.token as string,
        data.params.requestId as string
      );
      break;
    case 'passwordChanged':
      await mailer.passwordChanged(data.params.disavowalToken as string);
      break;
    case 'accountResetRequest':
      await mailer.accountResetRequest(
        data.params.requestToken as string,
        data.params.deletionPeriodHours as number
      );
      break;
    case 'accountResetGranted':
      await mailer.accountResetGranted(
        data.params.grantedToken as string,
        data.params.tokenValidHours as number
      );
      break;
    case 'accountResetComplete':
      await mailer.accountResetComplete();
      break;
    default:
      throw new Error(`Unknown email type: ${data.emailType}`);
  }
});

/**
 * Enqueue an email to be sent
 */
export async function enqueueEmail(
  user: { id: number; uuid: string; email: string; emailLanguage?: string },
  emailType: string,
  params: Record<string, unknown>
): Promise<string> {
  return enqueue('sendEmail', {
    userId: user.id,
    userUuid: user.uuid,
    email: user.email,
    emailLanguage: user.emailLanguage,
    emailType,
    params,
  }, { queue: 'mailers' });
}

// ============================================================================
// SMS/Voice Jobs
// ============================================================================

interface SendOtpJobData {
  to: string;
  otp: string;
  expiration: number;
  otpFormat: 'digit' | 'alphanumeric';
  channel: 'sms' | 'voice';
  domain: string;
  countryCode: string;
  otpLength?: number;
  isConfirmation: boolean;
}

registerHandler<SendOtpJobData>('sendSms', async (data) => {
  if (data.channel !== 'sms') return;
  
  if (data.isConfirmation) {
    await sendConfirmationOtp({
      to: data.to,
      otp: data.otp,
      expiration: data.expiration,
      otpFormat: data.otpFormat,
      channel: data.channel,
      domain: data.domain,
      countryCode: data.countryCode,
      otpLength: data.otpLength,
    });
  } else {
    await sendAuthenticationOtp({
      to: data.to,
      otp: data.otp,
      expiration: data.expiration,
      otpFormat: data.otpFormat,
      channel: data.channel,
      domain: data.domain,
      countryCode: data.countryCode,
    });
  }
});

registerHandler<SendOtpJobData>('sendVoice', async (data) => {
  if (data.channel !== 'voice') return;
  
  if (data.isConfirmation) {
    await sendConfirmationOtp({
      to: data.to,
      otp: data.otp,
      expiration: data.expiration,
      otpFormat: data.otpFormat,
      channel: data.channel,
      domain: data.domain,
      countryCode: data.countryCode,
      otpLength: data.otpLength,
    });
  } else {
    await sendAuthenticationOtp({
      to: data.to,
      otp: data.otp,
      expiration: data.expiration,
      otpFormat: data.otpFormat,
      channel: data.channel,
      domain: data.domain,
      countryCode: data.countryCode,
    });
  }
});

/**
 * Enqueue an OTP to be sent
 */
export async function enqueueOtp(params: SendOtpJobData): Promise<string> {
  const jobName: JobName = params.channel === 'voice' ? 'sendVoice' : 'sendSms';
  return enqueue(jobName, params, { queue: 'sms' });
}

// ============================================================================
// Account Reset Jobs
// ============================================================================

interface AccountResetGrantJobData {
  userId: number;
  accountResetId: number;
}

registerHandler<AccountResetGrantJobData>('accountResetGrant', async (data) => {
  // TODO: Implement account reset grant logic
  // 1. Load account reset request
  // 2. Grant the reset (set granted_at, granted_token)
  // 3. Send email notification
  console.log('Processing account reset grant for user:', data.userId);
});

/**
 * Schedule account reset grant (runs after waiting period)
 */
export async function scheduleAccountResetGrant(
  userId: number,
  accountResetId: number,
  grantAt: Date
): Promise<string> {
  return scheduleJob('accountResetGrant', {
    userId,
    accountResetId,
  }, grantAt);
}

// ============================================================================
// GPO Letter Jobs
// ============================================================================

interface GpoLetterJobData {
  userId: number;
  profileId: number;
}

registerHandler<GpoLetterJobData>('gpoLetter', async (data) => {
  // TODO: Implement GPO letter enqueueing
  // 1. Load user profile with PII
  // 2. Submit to GPO API
  // 3. Update profile with confirmation code
  console.log('Enqueueing GPO letter for user:', data.userId);
});

/**
 * Enqueue GPO verification letter
 */
export async function enqueueGpoLetter(
  userId: number,
  profileId: number
): Promise<string> {
  return enqueue('gpoLetter', { userId, profileId }, { queue: 'default' });
}

// ============================================================================
// New Device Alert Job
// ============================================================================

interface NewDeviceAlertJobData {
  userId: number;
  email: string;
  events: Array<{ eventType: string; occurredAt: string; ip: string; userAgent: string }>;
  disavowalToken: string;
}

registerHandler<NewDeviceAlertJobData>('newDeviceAlert', async (data) => {
  const user = {
    id: data.userId,
    uuid: '', // Will be loaded
    email: data.email,
  };
  const emailAddress = { email: data.email };
  const mailer = createUserMailer(user, emailAddress);

  const events = data.events.map(e => ({
    ...e,
    occurredAt: new Date(e.occurredAt),
  }));

  await mailer.newDeviceSignInAfter2fa(events, data.disavowalToken);
});

/**
 * Enqueue new device sign-in alert
 */
export async function enqueueNewDeviceAlert(
  userId: number,
  email: string,
  events: Array<{ eventType: string; occurredAt: Date; ip: string; userAgent: string }>,
  disavowalToken: string
): Promise<string> {
  return enqueue('newDeviceAlert', {
    userId,
    email,
    events: events.map(e => ({ ...e, occurredAt: e.occurredAt.toISOString() })),
    disavowalToken,
  }, { queue: 'mailers' });
}

// ============================================================================
// Heartbeat Job (health check)
// ============================================================================

registerHandler('heartbeat', async () => {
  console.log('Heartbeat:', new Date().toISOString());
});

/**
 * Schedule recurring heartbeat
 */
export async function scheduleHeartbeat(): Promise<void> {
  const { scheduleRecurring } = await import('./queue');
  await scheduleRecurring('heartbeat', '*/5 * * * *', {}, { queue: 'low' });
}
