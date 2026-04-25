/**
 * Pinpoint Voice Sender
 * Mirrors: lib/telephony/pinpoint/voice_sender.rb
 */

import {
  PinpointSMSVoiceClient,
  SendVoiceMessageCommand,
} from '@aws-sdk/client-pinpoint-sms-voice';
import { getTelephonyConfig, type PinpointVoiceConfig } from './config';
import { ConfigurationError } from './errors';
import type { TelephonyResponse, SendVoiceParams } from './types';

// Client pool per region
const clientPool = new Map<string, PinpointSMSVoiceClient>();

function getClient(config: PinpointVoiceConfig): PinpointSMSVoiceClient {
  const key = config.region;
  
  if (!clientPool.has(key)) {
    const client = new PinpointSMSVoiceClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      maxAttempts: 1,
    });
    clientPool.set(key, client);
  }
  
  return clientPool.get(key)!;
}

/**
 * Select origination phone number from pool
 */
function selectOriginationNumber(config: PinpointVoiceConfig): string | undefined {
  if (!config.longCodePool || config.longCodePool.length === 0) {
    return undefined;
  }
  // Round-robin selection
  const index = Math.floor(Math.random() * config.longCodePool.length);
  return config.longCodePool[index];
}

/**
 * Convert text to SSML for voice synthesis
 */
function textToSsml(text: string, languageCode: string): string {
  // Escape XML special characters
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  return `<speak><lang xml:lang="${languageCode}">${escaped}</lang></speak>`;
}

export class VoiceSender {
  /**
   * Send voice message via Pinpoint
   */
  async deliver(params: SendVoiceParams): Promise<TelephonyResponse> {
    const config = getTelephonyConfig();
    
    if (config.pinpoint.voiceConfigs.length === 0) {
      return {
        success: false,
        error: new ConfigurationError('No voice configs available'),
      };
    }
    
    const languageCode = params.languageCode || config.voiceLanguageCode;
    let lastResponse: TelephonyResponse | null = null;
    
    // Try each voice config (failover between regions)
    for (const voiceConfig of config.pinpoint.voiceConfigs) {
      const startTime = Date.now();
      
      try {
        const client = getClient(voiceConfig);
        const originationNumber = selectOriginationNumber(voiceConfig);
        
        const command = new SendVoiceMessageCommand({
          DestinationPhoneNumber: params.to,
          OriginationPhoneNumber: originationNumber,
          Content: {
            SSMLMessage: {
              Text: textToSsml(params.message, languageCode),
              LanguageCode: languageCode,
              VoiceId: getVoiceId(languageCode),
            },
          },
        });
        
        const result = await client.send(command);
        const durationMs = Date.now() - startTime;
        
        if (result.MessageId) {
          return {
            success: true,
            extra: {
              messageId: result.MessageId,
              durationMs,
            },
          };
        }
        
        lastResponse = {
          success: false,
          error: { code: 'NO_MESSAGE_ID', message: 'No message ID returned', retryable: true },
          extra: { durationMs },
        };
        
        console.warn(`Pinpoint voice failover from ${voiceConfig.region}`);
        
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.error(`Pinpoint voice error in ${voiceConfig.region}:`, error);
        
        lastResponse = {
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          },
          extra: { durationMs },
        };
      }
    }
    
    return lastResponse || {
      success: false,
      error: new ConfigurationError('All voice configs failed'),
    };
  }
}

/**
 * Get Amazon Polly voice ID for language
 */
function getVoiceId(languageCode: string): string {
  const voiceMap: Record<string, string> = {
    'en-US': 'Joey',
    'en-GB': 'Brian',
    'es-ES': 'Enrique',
    'es-US': 'Miguel',
    'fr-FR': 'Mathieu',
    'fr-CA': 'Chantal',
    'zh-CN': 'Zhiyu',
  };
  
  return voiceMap[languageCode] || 'Joey';
}

// Singleton instance
let voiceSenderInstance: VoiceSender | null = null;

export function getVoiceSender(): VoiceSender {
  if (!voiceSenderInstance) {
    voiceSenderInstance = new VoiceSender();
  }
  return voiceSenderInstance;
}
