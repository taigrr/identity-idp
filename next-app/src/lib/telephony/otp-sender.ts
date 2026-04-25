/**
 * OTP Sender
 * Mirrors: lib/telephony/otp_sender.rb
 */

import { getSmsSender } from './sms-sender';
import { getVoiceSender } from './voice-sender';
import type { TelephonyResponse, OtpParams, Channel } from './types';

export interface OtpSenderParams {
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

/**
 * Format OTP with spaces for readability in voice
 */
function formatOtpForVoice(otp: string): string {
  return otp.split('').join('. ');
}

/**
 * Generate authentication OTP message
 */
function authenticationOtpMessage(
  otp: string,
  expiration: number,
  domain: string,
  channel: Channel
): string {
  const formattedOtp = channel === 'voice' ? formatOtpForVoice(otp) : otp;
  
  if (channel === 'voice') {
    return `Hello! Your ${domain} one time code is: ${formattedOtp}. ` +
           `Again, your code is: ${formattedOtp}. ` +
           `This code expires in ${expiration} minutes.`;
  }
  
  return `Your ${domain} one-time code is ${formattedOtp}. ` +
         `It expires in ${expiration} minutes. ` +
         `Don't share this code with anyone.`;
}

/**
 * Generate confirmation OTP message
 */
function confirmationOtpMessage(
  otp: string,
  expiration: number,
  domain: string,
  channel: Channel,
  otpLength?: number
): string {
  const formattedOtp = channel === 'voice' ? formatOtpForVoice(otp) : otp;
  const length = otpLength || otp.length;
  
  if (channel === 'voice') {
    return `Hello! Your ${domain} ${length}-digit code is: ${formattedOtp}. ` +
           `Again, your code is: ${formattedOtp}. ` +
           `This code expires in ${expiration} minutes.`;
  }
  
  return `Your ${domain} ${length}-digit code is ${formattedOtp}. ` +
         `It expires in ${expiration} minutes. ` +
         `Don't share this code with anyone.`;
}

export class OtpSender {
  private params: OtpSenderParams;

  constructor(params: OtpSenderParams) {
    this.params = params;
  }

  /**
   * Send authentication OTP (for login MFA)
   */
  async sendAuthenticationOtp(): Promise<TelephonyResponse> {
    const message = authenticationOtpMessage(
      this.params.otp,
      this.params.expiration,
      this.params.domain,
      this.params.channel
    );

    return this.send(message);
  }

  /**
   * Send confirmation OTP (for phone setup)
   */
  async sendConfirmationOtp(): Promise<TelephonyResponse> {
    const message = confirmationOtpMessage(
      this.params.otp,
      this.params.expiration,
      this.params.domain,
      this.params.channel,
      this.params.otpLength
    );

    return this.send(message);
  }

  /**
   * Send message via appropriate channel
   */
  private async send(message: string): Promise<TelephonyResponse> {
    if (this.params.channel === 'voice') {
      const sender = getVoiceSender();
      return sender.deliver({
        to: this.params.to,
        message,
        countryCode: this.params.countryCode,
      });
    }

    const sender = getSmsSender();
    return sender.deliver({
      to: this.params.to,
      message,
      countryCode: this.params.countryCode,
      otp: this.params.otp,
    });
  }
}
