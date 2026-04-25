/**
 * Telephony Configuration
 * Mirrors: lib/telephony/configuration.rb
 */

import { getConfig as getAppConfig } from '../config';

export interface PinpointSmsConfig {
  applicationId: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  longCodePool?: string[];
  shortCode?: string;
}

export interface PinpointVoiceConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  longCodePool?: string[];
}

export interface TelephonyConfig {
  adapter: 'pinpoint' | 'test';
  pinpoint: {
    smsConfigs: PinpointSmsConfig[];
    voiceConfigs: PinpointVoiceConfig[];
  };
  countrySenderIds: Record<string, string>;
  voiceLanguageCode: string;
  recordVoiceCalls: boolean;
}

let telephonyConfig: TelephonyConfig | null = null;

/**
 * Get telephony configuration from environment
 */
export function getTelephonyConfig(): TelephonyConfig {
  if (telephonyConfig) {
    return telephonyConfig;
  }

  const appConfig = getAppConfig();
  const env = process.env;

  // Parse SMS configs from environment (comma-separated regions)
  const smsRegions = (env.PINPOINT_SMS_REGIONS || 'us-west-2').split(',');
  const smsConfigs: PinpointSmsConfig[] = smsRegions.map((region) => ({
    applicationId: env[`PINPOINT_SMS_APPLICATION_ID_${region.toUpperCase().replace(/-/g, '_')}`] ||
                   env.PINPOINT_SMS_APPLICATION_ID || '',
    region: region.trim(),
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    longCodePool: env.PINPOINT_SMS_LONG_CODE_POOL?.split(','),
    shortCode: env.PINPOINT_SMS_SHORT_CODE,
  }));

  // Parse voice configs from environment
  const voiceRegions = (env.PINPOINT_VOICE_REGIONS || 'us-west-2').split(',');
  const voiceConfigs: PinpointVoiceConfig[] = voiceRegions.map((region) => ({
    region: region.trim(),
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    longCodePool: env.PINPOINT_VOICE_LONG_CODE_POOL?.split(','),
  }));

  // Parse country sender IDs (JSON map)
  let countrySenderIds: Record<string, string> = {};
  if (env.TELEPHONY_COUNTRY_SENDER_IDS) {
    try {
      countrySenderIds = JSON.parse(env.TELEPHONY_COUNTRY_SENDER_IDS);
    } catch {
      console.warn('Failed to parse TELEPHONY_COUNTRY_SENDER_IDS');
    }
  }

  telephonyConfig = {
    adapter: (env.TELEPHONY_ADAPTER as 'pinpoint' | 'test') || 'pinpoint',
    pinpoint: {
      smsConfigs: smsConfigs.filter((c) => c.applicationId),
      voiceConfigs,
    },
    countrySenderIds,
    voiceLanguageCode: env.PINPOINT_VOICE_LANGUAGE_CODE || 'en-US',
    recordVoiceCalls: env.PINPOINT_RECORD_VOICE_CALLS === 'true',
  };

  return telephonyConfig;
}

/**
 * Reset configuration (for testing)
 */
export function resetTelephonyConfig(): void {
  telephonyConfig = null;
}

/**
 * Set configuration directly (for testing)
 */
export function setTelephonyConfig(config: TelephonyConfig): void {
  telephonyConfig = config;
}
