/**
 * Telephony Types
 * Mirrors: lib/telephony/response.rb and related types
 */

export type Channel = 'sms' | 'voice';

export interface TelephonyResponse {
  success: boolean;
  error?: TelephonyError;
  extra?: {
    requestId?: string;
    messageId?: string;
    deliveryStatus?: string;
    statusCode?: number;
    statusMessage?: string;
    durationMs?: number;
  };
}

export interface TelephonyError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface PhoneNumberInfo {
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  countryCode?: string;
  error?: string;
}

export interface SendMessageParams {
  to: string;
  message: string;
  countryCode: string;
  otp?: string;
}

export interface SendVoiceParams {
  to: string;
  message: string;
  countryCode: string;
  languageCode?: string;
}

export interface OtpParams {
  to: string;
  otp: string;
  expiration: number;
  otpFormat: 'digit' | 'alphanumeric';
  channel: Channel;
  domain: string;
  countryCode: string;
  otpLength?: number;
  extraMetadata?: Record<string, unknown>;
}
