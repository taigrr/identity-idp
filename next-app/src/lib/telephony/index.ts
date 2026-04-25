/**
 * Telephony Module
 * Mirrors: lib/telephony.rb
 *
 * Handles SMS and voice OTP delivery using AWS Pinpoint
 */

export * from './types';
export { 
  TelephonyError,
  DuplicateEndpointError,
  OptOutError,
  PermanentFailureError,
  TemporaryFailureError,
  RateLimitedError,
  TimeoutError,
  UnknownFailureError,
  InvalidPhoneNumberError,
  ConfigurationError,
  PINPOINT_ERROR_MAP,
  createErrorFromDeliveryStatus,
} from './errors';
export * from './config';
export * from './sms-sender';
export * from './voice-sender';
export * from './otp-sender';
export * from './phone-info';

import { OtpSender, type OtpSenderParams } from './otp-sender';
import { getTelephonyConfig } from './config';

/**
 * Send authentication OTP (for login MFA)
 */
export async function sendAuthenticationOtp(params: Omit<OtpSenderParams, 'otpLength'>) {
  const sender = new OtpSender(params);
  return sender.sendAuthenticationOtp();
}

/**
 * Send confirmation OTP (for phone setup)
 */
export async function sendConfirmationOtp(params: OtpSenderParams) {
  const sender = new OtpSender(params);
  return sender.sendConfirmationOtp();
}

/**
 * Get telephony configuration
 */
export function getConfig() {
  return getTelephonyConfig();
}

// GSM 03.38 character set for SMS encoding detection
// https://docs.aws.amazon.com/pinpoint/latest/userguide/channels-sms-limitations-characters.html
export const GSM_NON_WHITESPACE_CHARACTERS = new Set([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'à', 'Å', 'å', 'Ä', 'ä', 'Ç', 'É', 'é', 'è', 'ì', 'Ñ', 'ñ', 'ò', 'Ø', 'ø', 'Ö', 'ö', 'ù', 'Ü', 'ü', 'Æ', 'æ', 'ß',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '&', '*', '@', ':', ',', '¤', '$', '=', '!', '>', '#', '-', '¡', '¿', '(', '<', '%', '.', '+', '£', '?', '"', ')', '§', ';', "'", '/', '_', '¥',
  'Δ', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ',
]);

export const GSM_WHITESPACE_CHARACTERS = new Set(['\n', '\r', ' ']);
export const GSM_DOUBLE_CHARACTERS = new Set(['^', '{', '}', '\\', '[', ']', '~', '|', '€']);
export const GSM_CHARACTERS = new Set([
  ...GSM_NON_WHITESPACE_CHARACTERS,
  ...GSM_WHITESPACE_CHARACTERS,
  ...GSM_DOUBLE_CHARACTERS,
]);

/**
 * Check if message uses only GSM characters (cheaper SMS encoding)
 */
export function isGsmEncoding(message: string): boolean {
  for (const char of message) {
    if (!GSM_CHARACTERS.has(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate SMS segment count based on encoding
 */
export function calculateSmsSegments(message: string): number {
  const isGsm = isGsmEncoding(message);
  const charLimit = isGsm ? 160 : 70;
  const multipartCharLimit = isGsm ? 153 : 67;

  if (message.length <= charLimit) {
    return 1;
  }

  return Math.ceil(message.length / multipartCharLimit);
}
