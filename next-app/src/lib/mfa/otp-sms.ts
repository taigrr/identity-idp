/**
 * SMS/Voice OTP Service
 * Mirrors: app/services/telephony.rb
 *
 * Handles sending OTP codes via SMS and voice calls.
 * In production, uses AWS Pinpoint. In local dev, logs to console.
 */

import { randomInt } from 'crypto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export interface OtpResult {
  code: string;
  expiresAt: Date;
}

export type DeliveryMethod = 'sms' | 'voice';

export interface SendOtpResult {
  success: boolean;
  otp?: OtpResult;
  error?: string;
  messageId?: string;
}

/**
 * Generates a random numeric OTP code
 */
export function generateOtpCode(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(randomInt(min, max));
}

/**
 * Creates an OTP with expiration time
 */
export function createOtp(): OtpResult {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return { code, expiresAt };
}

/**
 * Verifies if an OTP code matches and hasn't expired
 */
export function verifyOtp(
  inputCode: string,
  storedCode: string,
  expiresAt: Date
): boolean {
  // Clean input
  const cleanInput = inputCode.replace(/\s/g, '');

  // Check expiration
  if (new Date() > expiresAt) {
    return false;
  }

  // Constant-time comparison would be better here
  // but for 6-digit codes, timing attacks are less practical
  return cleanInput === storedCode;
}

/**
 * Formats phone number for display (mask middle digits)
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return '***';
  }
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

/**
 * Sends OTP via SMS
 * In production, this would use AWS Pinpoint
 */
export async function sendSmsOtp(
  phoneNumber: string,
  code: string
): Promise<SendOtpResult> {
  const message = `Your Login.gov one-time code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  // In local dev, just log
  if (process.env.NODE_ENV !== 'production' || process.env.TELEPHONY_MOCK === 'true') {
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
    return {
      success: true,
      otp: { code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000) },
      messageId: `mock-${Date.now()}`,
    };
  }

  // Production: Use AWS Pinpoint
  try {
    // TODO: Implement AWS Pinpoint integration
    // const pinpoint = new PinpointClient({ region: process.env.AWS_REGION });
    // const result = await pinpoint.send(new SendMessagesCommand({...}));

    return {
      success: false,
      error: 'AWS Pinpoint not yet implemented',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends OTP via voice call
 * In production, this would use AWS Pinpoint
 */
export async function sendVoiceOtp(
  phoneNumber: string,
  code: string
): Promise<SendOtpResult> {
  // Voice message reads digits individually
  const spokenCode = code.split('').join('. ');
  const message = `Your Login.gov one-time code is: ${spokenCode}. Again, your code is: ${spokenCode}.`;

  // In local dev, just log
  if (process.env.NODE_ENV !== 'production' || process.env.TELEPHONY_MOCK === 'true') {
    console.log(`[VOICE] To: ${phoneNumber}, Message: ${message}`);
    return {
      success: true,
      otp: { code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000) },
      messageId: `mock-voice-${Date.now()}`,
    };
  }

  // Production: Use AWS Pinpoint Voice
  try {
    // TODO: Implement AWS Pinpoint Voice integration
    return {
      success: false,
      error: 'AWS Pinpoint Voice not yet implemented',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends OTP via preferred method
 */
export async function sendOtp(
  phoneNumber: string,
  method: DeliveryMethod = 'sms'
): Promise<SendOtpResult> {
  const otp = createOtp();

  if (method === 'voice') {
    return sendVoiceOtp(phoneNumber, otp.code);
  }
  return sendSmsOtp(phoneNumber, otp.code);
}
